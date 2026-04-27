package com.agileflow.service;

import com.agileflow.entity.Project;
import com.agileflow.entity.Sprint;
import com.agileflow.entity.Task;
import com.agileflow.entity.User;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class EmailTemplateService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

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
                formatDate(task.getDateEcheance()),
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
                """.formatted(fullName(recipient), task.getTitre(), formatDate(task.getDateEcheance()));
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
                .dateEcheance(LocalDate.now().plusDays(3))
                .sprint(sprint)
                .build();
    }

    private String fullName(User user) {
        if (user == null) {
            return "Utilisateur";
        }
        String value = ((user.getPrenom() != null ? user.getPrenom() : "") + " " + (user.getNom() != null ? user.getNom() : "")).trim();
        return value.isBlank() ? user.getEmail() : value;
    }

    private String formatDate(LocalDate date) {
        return date != null ? date.format(DATE_FORMAT) : "Non definie";
    }

    public record RenderedEmail(String subject, String html) {
    }
}
