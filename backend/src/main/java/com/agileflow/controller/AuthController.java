package com.agileflow.controller;

import com.agileflow.repository.UserRepository;
import com.agileflow.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @GetMapping("/check-email")
    public ResponseEntity<Map<String, Boolean>> checkEmail(@RequestParam String email) {
        boolean available = userRepository.findByEmail(email.trim().toLowerCase())
                .map(user -> !user.isEmailVerified())
                .orElse(true);
        return ResponseEntity.ok(Map.of("available", available));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthService.RegisterResponse> register(@RequestBody AuthService.RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<AuthService.AuthResponse> verifyEmail(@RequestBody AuthService.EmailVerificationRequest request) {
        return ResponseEntity.ok(authService.verifyEmail(request));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<AuthService.RegisterResponse> resendVerification(@RequestBody AuthService.ResendVerificationRequest request) {
        return ResponseEntity.ok(authService.resendVerificationCode(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<AuthService.OtpResponse> forgotPassword(@RequestBody AuthService.ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.requestPasswordReset(request));
    }

    @PostMapping("/forgot-password/resend")
    public ResponseEntity<AuthService.OtpResponse> resendForgotPassword(@RequestBody AuthService.ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.resendPasswordReset(request));
    }

    @PostMapping("/verify-reset-otp")
    public ResponseEntity<AuthService.MessageResponse> verifyResetOtp(@RequestBody AuthService.VerifyPasswordResetOtpRequest request) {
        return ResponseEntity.ok(authService.verifyPasswordResetOtp(request));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<AuthService.MessageResponse> resetPassword(@RequestBody AuthService.ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthService.AuthResponse> login(@RequestBody AuthService.LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthService.AuthResponse> refresh(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().build();
        }
        String refreshToken = authHeader.substring(7); // "Bearer " = 7 caractères
        return ResponseEntity.ok(authService.refreshToken(refreshToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout() {
        // En authentification JWT pure (Stateless), le logout est géré par le Frontend 
        // en supprimant le token du LocalStorage ou des Cookies.
        return ResponseEntity.ok("Déconnexion réussie. Veuillez supprimer le token côté client.");
    }
}
