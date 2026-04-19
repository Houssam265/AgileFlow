package com.agileflow.service;

import com.agileflow.entity.User;
import com.agileflow.repository.UserRepository;
import com.agileflow.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Email déjà utilisé.");
        }

        User user = User.builder()
                .nom(request.nom())
                .prenom(request.prenom())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(User.Role.ROLE_DEVELOPER) // Rôle toujours fixé côté serveur, jamais côté client
                .actif(true)
                .dateCreation(LocalDateTime.now())
                .build();

        userRepository.save(user);

        return generateTokens(user);
    }

    public AuthResponse login(LoginRequest request) {
        // Cette étape valide automatiquement le mot de passe via SecurityConfig
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        return generateTokens(user);
    }

    public AuthResponse refreshToken(String refreshToken) {
        String email = jwtUtil.extractUsername(refreshToken);
        if (email != null) {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            if (jwtUtil.validateToken(refreshToken, email)) {
                return generateTokens(user);
            }
        }
        throw new RuntimeException("Refresh token invalide ou expiré");
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

    // Les DTOs demandés via des records Java
    public record RegisterRequest(String nom, String prenom, String email, String password) {}
    public record LoginRequest(String email, String password) {}
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
