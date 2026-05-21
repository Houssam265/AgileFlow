package com.agileflow.service;

import com.agileflow.entity.User;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.mail.from-name:AgileFlow Support}")
    private String fromName;

    public void sendVerificationCode(User user, String otp, LocalDateTime expiresAt) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setFrom(fromName + " <" + fromEmail + ">");
            helper.setTo(user.getEmail());
            helper.setSubject("Code de verification AgileFlow");
            helper.setText(buildHtml(user, otp, expiresAt), true);
            mailSender.send(mimeMessage);
        } catch (Exception ex) {
            throw new RuntimeException("Impossible d'envoyer le code de verification par email.", ex);
        }
    }

    private String buildHtml(User user, String otp, LocalDateTime expiresAt) {
        String name = user.getPrenom() == null || user.getPrenom().isBlank() ? "Utilisateur" : user.getPrenom();
        String expires = expiresAt.format(DateTimeFormatter.ofPattern("HH:mm"));
        return """
                <div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
                  <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e5e7eb;">
                    <h2 style="margin:0 0 12px;color:#111827;">Verification de votre email</h2>
                    <p style="color:#374151;font-size:15px;">Bonjour %s,</p>
                    <p style="color:#374151;font-size:15px;">Utilisez ce code pour activer votre compte AgileFlow :</p>
                    <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#2563eb;background:#eff6ff;border-radius:10px;text-align:center;padding:16px;margin:24px 0;">%s</div>
                    <p style="color:#6b7280;font-size:13px;">Ce code expire a %s. Si vous n'avez pas demande cette inscription, ignorez cet email.</p>
                  </div>
                </div>
                """.formatted(escape(name), otp, expires);
    }

    private String escape(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
