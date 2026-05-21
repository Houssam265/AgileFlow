package com.agileflow.service;

import com.agileflow.entity.User;
import com.agileflow.repository.UserRepository;
import com.agileflow.security.JwtUtil;
import com.agileflow.validation.PasswordValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final int OTP_EXPIRATION_MINUTES = 10;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final PasswordValidator passwordValidator;
    private final EmailVerificationService emailVerificationService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        passwordValidator.assertValid(request.password());
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmail(email).orElse(null);

        if (user != null && user.isEmailVerified()) {
            throw new RuntimeException("Email deja utilise.");
        }

        if (user == null) {
            user = User.builder()
                    .nom(request.nom())
                    .prenom(request.prenom())
                    .email(email)
                    .password(passwordEncoder.encode(request.password()))
                    .role(User.Role.ROLE_DEVELOPER)
                    .actif(false)
                    .emailVerified(false)
                    .dateCreation(LocalDateTime.now())
                    .build();
        } else {
            user.setNom(request.nom());
            user.setPrenom(request.prenom());
            user.setPassword(passwordEncoder.encode(request.password()));
            user.setRole(User.Role.ROLE_DEVELOPER);
            user.setActif(false);
            user.setEmailVerified(false);
        }

        String otp = generateOtp();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(OTP_EXPIRATION_MINUTES);
        user.setEmailVerificationOtpHash(passwordEncoder.encode(otp));
        user.setEmailVerificationOtpExpiresAt(expiresAt);
        userRepository.save(user);
        emailVerificationService.sendVerificationCode(user, otp, expiresAt);

        return new RegisterResponse(
                email,
                "Un code OTP a ete envoye a votre adresse email.",
                OTP_EXPIRATION_MINUTES
        );
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouve"));
        if (!user.isEmailVerified()) {
            if (!user.isActif()) {
                throw new RuntimeException("Veuillez verifier votre email avant de vous connecter.");
            }
            user.setEmailVerified(true);
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password())
        );

        user.setDateDerniereConnexion(LocalDateTime.now());
        userRepository.save(user);

        return generateTokens(user);
    }

    public AuthResponse refreshToken(String refreshToken) {
        String email = jwtUtil.extractUsername(refreshToken);
        if (email != null) {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouve"));

            if (jwtUtil.validateToken(refreshToken, email)) {
                return generateTokens(user);
            }
        }
        throw new RuntimeException("Refresh token invalide ou expire");
    }

    @Transactional
    public AuthResponse verifyEmail(EmailVerificationRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.email()))
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouve"));

        if (user.isEmailVerified()) {
            return generateTokens(user);
        }
        if (isBlank(user.getEmailVerificationOtpHash()) || user.getEmailVerificationOtpExpiresAt() == null) {
            throw new RuntimeException("Aucun code de verification actif. Demandez un nouveau code.");
        }
        if (LocalDateTime.now().isAfter(user.getEmailVerificationOtpExpiresAt())) {
            throw new RuntimeException("Code OTP expire. Demandez un nouveau code.");
        }
        if (!passwordEncoder.matches(normalizeOtp(request.otp()), user.getEmailVerificationOtpHash())) {
            throw new RuntimeException("Code OTP incorrect.");
        }

        user.setEmailVerified(true);
        user.setActif(true);
        user.setEmailVerificationOtpHash(null);
        user.setEmailVerificationOtpExpiresAt(null);
        user.setDateDerniereConnexion(LocalDateTime.now());
        userRepository.save(user);

        return generateTokens(user);
    }

    @Transactional
    public RegisterResponse resendVerificationCode(ResendVerificationRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.email()))
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouve"));
        if (user.isEmailVerified()) {
            throw new RuntimeException("Cet email est deja verifie.");
        }

        String otp = generateOtp();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(OTP_EXPIRATION_MINUTES);
        user.setEmailVerificationOtpHash(passwordEncoder.encode(otp));
        user.setEmailVerificationOtpExpiresAt(expiresAt);
        userRepository.save(user);
        emailVerificationService.sendVerificationCode(user, otp, expiresAt);

        return new RegisterResponse(
                user.getEmail(),
                "Un nouveau code OTP a ete envoye.",
                OTP_EXPIRATION_MINUTES
        );
    }

    @Transactional
    public AuthResponse loginWithOAuth(String provider, OAuth2User oauthUser, String providerAccessToken) {
        String normalizedProvider = provider == null ? "" : provider.toLowerCase();
        String email = extractOAuthEmail(normalizedProvider, oauthUser, providerAccessToken);
        if (isBlank(email)) {
            throw new RuntimeException("Impossible de recuperer l'email du compte " + normalizedProvider);
        }

        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail).orElseGet(() -> {
            String fullName = firstNonBlank(
                    attribute(oauthUser, "name"),
                    attribute(oauthUser, "login"),
                    emailLocalPart(normalizedEmail)
            );
            String firstName = firstNonBlank(
                    attribute(oauthUser, "given_name"),
                    firstNameFrom(fullName),
                    "Utilisateur"
            );
            String lastName = firstNonBlank(
                    attribute(oauthUser, "family_name"),
                    lastNameFrom(fullName),
                    normalizedProvider.isBlank() ? "OAuth" : capitalize(normalizedProvider)
            );

            return User.builder()
                    .nom(lastName)
                    .prenom(firstName)
                    .email(normalizedEmail)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(User.Role.ROLE_DEVELOPER)
                    .actif(true)
                    .emailVerified(true)
                    .dateCreation(LocalDateTime.now())
                    .build();
        });

        if (isBlank(user.getPrenom())) {
            user.setPrenom(firstNonBlank(attribute(oauthUser, "given_name"), firstNameFrom(attribute(oauthUser, "name")), "Utilisateur"));
        }
        if (isBlank(user.getNom())) {
            user.setNom(firstNonBlank(attribute(oauthUser, "family_name"), lastNameFrom(attribute(oauthUser, "name")), capitalize(normalizedProvider)));
        }
        user.setActif(true);
        user.setEmailVerified(true);
        user.setEmailVerificationOtpHash(null);
        user.setEmailVerificationOtpExpiresAt(null);
        user.setDateDerniereConnexion(LocalDateTime.now());
        userRepository.save(user);

        return generateTokens(user);
    }

    private String extractOAuthEmail(String provider, OAuth2User oauthUser, String providerAccessToken) {
        String email = attribute(oauthUser, "email");
        if (!isBlank(email)) {
            return email;
        }

        if ("github".equals(provider)) {
            email = fetchPrimaryGithubEmail(providerAccessToken);
            if (!isBlank(email)) {
                return email;
            }

            String login = attribute(oauthUser, "login");
            if (!isBlank(login)) {
                return login + "@github.local";
            }
        }

        return null;
    }

    private String fetchPrimaryGithubEmail(String accessToken) {
        if (isBlank(accessToken)) {
            return null;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            ResponseEntity<List> response = new RestTemplate().exchange(
                    "https://api.github.com/user/emails",
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    List.class
            );

            List<?> emails = response.getBody();
            if (emails == null) {
                return null;
            }

            for (Object item : emails) {
                if (item instanceof Map<?, ?> emailInfo
                        && Boolean.TRUE.equals(emailInfo.get("primary"))
                        && Boolean.TRUE.equals(emailInfo.get("verified"))) {
                    Object emailValue = emailInfo.get("email");
                    return emailValue == null ? null : emailValue.toString();
                }
            }
        } catch (Exception ignored) {
            return null;
        }

        return null;
    }

    private String generateOtp() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }

    private String normalizeEmail(String email) {
        if (isBlank(email)) {
            throw new RuntimeException("Email obligatoire.");
        }
        return email.trim().toLowerCase();
    }

    private String normalizeOtp(String otp) {
        if (isBlank(otp)) {
            throw new RuntimeException("Code OTP obligatoire.");
        }
        return otp.trim();
    }

    private String emailLocalPart(String email) {
        int atIndex = email.indexOf('@');
        return atIndex > 0 ? email.substring(0, atIndex) : email;
    }

    private String attribute(OAuth2User oauthUser, String key) {
        Object value = oauthUser.getAttribute(key);
        return value == null ? null : value.toString();
    }

    private String firstNameFrom(String fullName) {
        if (isBlank(fullName)) {
            return null;
        }
        return fullName.trim().split("\\s+")[0];
    }

    private String lastNameFrom(String fullName) {
        if (isBlank(fullName)) {
            return null;
        }
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length <= 1) {
            return null;
        }
        return String.join(" ", java.util.Arrays.copyOfRange(parts, 1, parts.length));
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (!isBlank(value)) {
                return value.trim();
            }
        }
        return "";
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String capitalize(String value) {
        if (isBlank(value)) {
            return "OAuth";
        }
        return value.substring(0, 1).toUpperCase() + value.substring(1).toLowerCase();
    }

    private AuthResponse generateTokens(User user) {
        List<String> roles = List.of(user.getRole().name());
        String accessToken = jwtUtil.generateAccessToken(user.getEmail(), roles);
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return new AuthResponse(
                accessToken,
                refreshToken,
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                user.getPrenom(),
                user.getNom()
        );
    }

    public record RegisterRequest(String nom, String prenom, String email, String password) {}
    public record LoginRequest(String email, String password) {}
    public record EmailVerificationRequest(String email, String otp) {}
    public record ResendVerificationRequest(String email) {}
    public record RegisterResponse(String email, String message, int expiresInMinutes) {}
    public record AuthResponse(
            String accessToken,
            String refreshToken,
            Long userId,
            String email,
            String role,
            String prenom,
            String nom
    ) {}
}
