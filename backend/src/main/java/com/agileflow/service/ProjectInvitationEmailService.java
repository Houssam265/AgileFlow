package com.agileflow.service;

import com.agileflow.entity.Project;
import com.agileflow.entity.User;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProjectInvitationEmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.mail.from-name:AgileFlow Support}")
    private String fromName;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public void sendProjectInvitation(String recipientEmail, User inviter, Project project, String token) {
        try {
            String inviteUrl = frontendUrl + "/project-invite?token=" + token;
            String inviterName = inviter.getPrenom() + " " + inviter.getNom();
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setFrom(fromName + " <" + fromEmail + ">");
            helper.setTo(recipientEmail);
            helper.setSubject("Invitation au projet " + project.getNom() + " - AgileFlow");
            helper.setText("""
                    <div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;">
                      <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e7eb;">
                        <h2 style="margin:0 0 12px;color:#111827;">Invitation projet AgileFlow</h2>
                        <p style="color:#374151;">Bonjour,</p>
                        <p style="color:#374151;"><strong>%s</strong> vous invite a rejoindre le projet <strong>%s</strong>.</p>
                        <p style="margin:24px 0;">
                          <a href="%s" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
                            Accepter l'invitation
                          </a>
                        </p>
                        <p style="color:#6b7280;font-size:13px;">Ce lien expire dans 7 jours. Si vous n'avez pas de compte, inscrivez-vous avec cette adresse email puis ouvrez le lien.</p>
                      </div>
                    </div>
                    """.formatted(escape(inviterName), escape(project.getNom()), inviteUrl), true);
            mailSender.send(mimeMessage);
        } catch (Exception ex) {
            throw new RuntimeException("Impossible d'envoyer l'invitation par email.", ex);
        }
    }

    private String escape(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
