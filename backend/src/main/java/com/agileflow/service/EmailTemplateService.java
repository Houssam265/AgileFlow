package com.agileflow.service;

import com.agileflow.entity.Project;
import com.agileflow.entity.Sprint;
import com.agileflow.entity.Task;
import com.agileflow.entity.User;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailTemplateService {

    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public RenderedEmail buildPreview(User recipient, EmailNotificationType type) {
        return switch (type) {
            case SPRINT_START -> buildSprintStarted(recipient, sampleSprint());
            case TASK_ASSIGNED -> buildTaskAssigned(recipient, sampleTask());
            case DEADLINE -> buildDeadlineReminder(recipient, sampleTask());
            case MENTION -> buildMention(recipient, sampleTask(), "Sara Manager");
        };
    }

    public RenderedEmail buildSprintStarted(User recipient, Sprint sprint) {
        String subject = "Sprint demarre: " + sprint.getNom();
        String html = """
                <html><body style="font-family:Arial,sans-serif;color:#1f2937;">
                  <h2 style="margin-bottom:8px;">Sprint lance</h2>
                  <p>Bonjour %s,</p>
                  <p>Le sprint <strong>%s</strong> du projet <strong>%s</strong> vient de demarrer.</p>
                  <ul>
                    <li>Date de debut: %s</li>
                    <li>Date de fin: %s</li>
                    <li>Capacite: %s points</li>
                  </ul>
                  <p>Pensez a consulter le backlog et le tableau Kanban pour suivre l'avancement.</p>
                </body></html>
                """.formatted(
                fullName(recipient),
                sprint.getNom(),
                sprint.getProject() != null ? sprint.getProject().getNom() : "Projet AgileFlow",
                formatDate(sprint.getDateDebut()),
                formatDate(sprint.getDateFin()),
                sprint.getCapacitePoints() != null ? sprint.getCapacitePoints() : 0
        );
        return new RenderedEmail(subject, html);
    }

    public RenderedEmail buildTaskAssigned(User recipient, Task task) {
        String subject = "Nouvelle tache assignee: " + task.getTitre();
        String html = """
                <html><body style="font-family:Arial,sans-serif;color:#1f2937;">
                  <h2 style="margin-bottom:8px;">Nouvelle assignation</h2>
                  <p>Bonjour %s,</p>
                  <p>Une nouvelle tache vous a ete assignee dans AgileFlow.</p>
                  <ul>
                    <li>Titre: <strong>%s</strong></li>
                    <li>Priorite: %s</li>
                    <li>Statut: %s</li>
                    <li>Echeance: %s</li>
                    <li>Sprint: %s</li>
                  </ul>
                  <p>%s</p>
                </body></html>
                """.formatted(
                fullName(recipient),
                task.getTitre(),
                task.getPriorite() != null ? task.getPriorite().name() : "MEDIUM",
                task.getStatut() != null ? task.getStatut().name() : "TODO",
                formatDateTime(task.getDateEcheance()),
                task.getSprint() != null ? task.getSprint().getNom() : "Non planifie",
                task.getDescription() == null || task.getDescription().isBlank()
                        ? "Consultez AgileFlow pour plus de details."
                        : task.getDescription()
        );
        return new RenderedEmail(subject, html);
    }

    public RenderedEmail buildDeadlineReminder(User recipient, Task task) {
        String subject = "Rappel echeance: " + task.getTitre();
        String html = """
                <html><body style="font-family:Arial,sans-serif;color:#1f2937;">
                  <h2>Rappel d'echeance</h2>
                  <p>Bonjour %s,</p>
                  <p>La tache <strong>%s</strong> approche de son echeance.</p>
                  <p>Date limite: <strong>%s</strong></p>
                </body></html>
                """.formatted(fullName(recipient), task.getTitre(), formatDateTime(task.getDateEcheance()));
        return new RenderedEmail(subject, html);
    }

    public RenderedEmail buildDeadlineReminder(User recipient, Task task, String kanbanUrl, String reminderLabel) {
        String projectName = resolveProjectName(task);
        String subject = "Alerte deadline " + reminderLabel + ": " + task.getTitre();
        String html = """
                <html>
                  <body style="margin:0;padding:24px;background-color:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
                    <table role="presentation" style="width:100%%;max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
                      <tr>
                        <td style="padding:24px 28px;background:linear-gradient(135deg,#ea580c,#f97316);color:#ffffff;">
                          <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:0.9;">Rappel deadline</div>
                          <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;">Il reste %s</h1>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:28px;">
                          <p style="margin:0 0 16px;">Bonjour %s,</p>
                          <p style="margin:0 0 20px;line-height:1.6;">
                            La tache suivante n'est pas encore marquee comme terminee et approche de son echeance.
                          </p>
                          <table role="presentation" style="width:100%%;border-collapse:collapse;margin:0 0 24px;">
                            <tr>
                              <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;width:160px;">Tache</td>
                              <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;"><strong>%s</strong></td>
                            </tr>
                            <tr>
                              <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;">Deadline</td>
                              <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;"><strong>%s</strong></td>
                            </tr>
                            <tr>
                              <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;">Projet</td>
                              <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;"><strong>%s</strong></td>
                            </tr>
                          </table>
                          <a href="%s" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;">
                            Ouvrir le Kanban
                          </a>
                        </td>
                      </tr>
                    </table>
                  </body>
                </html>
                """.formatted(
                reminderLabel,
                fullName(recipient),
                task.getTitre(),
                formatDateTime(task.getDateEcheance()),
                projectName,
                kanbanUrl
        );
        return new RenderedEmail(subject, html);
    }

    public RenderedEmail buildUrgentDeadlineAlert(User recipient, Task task, String kanbanUrl) {
        String projectName = resolveProjectName(task);

        String subject = "Alerte urgente: deadline proche pour " + task.getTitre();
        String html = """
                <html>
                  <body style="margin:0;padding:24px;background-color:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
                    <table role="presentation" style="width:100%%;max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
                      <tr>
                        <td style="padding:24px 28px;background:linear-gradient(135deg,#dc2626,#ef4444);color:#ffffff;">
                          <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:0.9;">Priorite intelligente</div>
                          <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;">Action requise sous 24h</h1>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:28px;">
                          <p style="margin:0 0 16px;">Bonjour %s,</p>
                          <p style="margin:0 0 20px;line-height:1.6;">
                            La tache ci-dessous vient d'etre marquee comme <strong>URGENT</strong> car sa deadline approche.
                          </p>
                          <table role="presentation" style="width:100%%;border-collapse:collapse;margin:0 0 24px;">
                            <tr>
                              <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;width:160px;">Tache</td>
                              <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;"><strong>%s</strong></td>
                            </tr>
                            <tr>
                              <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;">Deadline</td>
                              <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;"><strong>%s</strong></td>
                            </tr>
                            <tr>
                              <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;">Projet</td>
                              <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;"><strong>%s</strong></td>
                            </tr>
                          </table>
                          <a href="%s" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;">
                            Ouvrir le Kanban
                          </a>
                          <p style="margin:20px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
                            Merci de traiter cette tache en priorite pour limiter tout risque de retard.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </body>
                </html>
                """.formatted(
                fullName(recipient),
                task.getTitre(),
                formatDateTime(task.getDateEcheance()),
                projectName,
                kanbanUrl
        );
        return new RenderedEmail(subject, html);
    }

    public RenderedEmail buildMention(User recipient, Task task, String authorName) {
        String subject = "Vous avez ete mentionne dans: " + task.getTitre();
        String html = """
                <html><body style="font-family:Arial,sans-serif;color:#1f2937;">
                  <h2>Mention recue</h2>
                  <p>Bonjour %s,</p>
                  <p><strong>%s</strong> vous a mentionne sur la tache <strong>%s</strong>.</p>
                  <p>Ouvrez AgileFlow pour voir le contexte complet.</p>
                </body></html>
                """.formatted(fullName(recipient), authorName, task.getTitre());
        return new RenderedEmail(subject, html);
    }

    private Sprint sampleSprint() {
        Project project = Project.builder().nom("AgileFlow Platform").build();
        return Sprint.builder()
                .nom("Sprint 5")
                .dateDebut(LocalDate.now())
                .dateFin(LocalDate.now().plusDays(14))
                .capacitePoints(30)
                .project(project)
                .build();
    }

    private Task sampleTask() {
        Sprint sprint = sampleSprint();
        return Task.builder()
                .titre("Finaliser les emails enrichis")
                .description("Mettre a jour les preferences et les templates HTML.")
                .priorite(Task.Priorite.HIGH)
                .statut(Task.Statut.TODO)
                .dateEcheance(LocalDateTime.now().plusDays(3))
                .sprint(sprint)
                .build();
    }

    private String resolveProjectName(Task task) {
        String projectName = "Projet AgileFlow";
        if (task.getSprint() != null && task.getSprint().getProject() != null && task.getSprint().getProject().getNom() != null) {
            projectName = task.getSprint().getProject().getNom();
        } else if (task.getStory() != null
                && task.getStory().getBacklog() != null
                && task.getStory().getBacklog().getProject() != null
                && task.getStory().getBacklog().getProject().getNom() != null) {
            projectName = task.getStory().getBacklog().getProject().getNom();
        }
        return projectName;
    }

    private String fullName(User user) {
        if (user == null) {
            return "Utilisateur";
        }
        String value = ((user.getPrenom() != null ? user.getPrenom() : "") + " " + (user.getNom() != null ? user.getNom() : "")).trim();
        return value.isBlank() ? user.getEmail() : value;
    }

    private String formatDate(LocalDate date) {
        return date != null ? date.atStartOfDay().format(DATE_TIME_FORMAT) : "Non definie";
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(DATE_TIME_FORMAT) : "Non definie";
    }

    public record RenderedEmail(String subject, String html) {
    }
}
