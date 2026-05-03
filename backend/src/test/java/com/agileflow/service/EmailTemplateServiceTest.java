package com.agileflow.service;

import com.agileflow.entity.Project;
import com.agileflow.entity.Sprint;
import com.agileflow.entity.Task;
import com.agileflow.entity.User;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class EmailTemplateServiceTest {

    private final EmailTemplateService emailTemplateService = new EmailTemplateService();

    @Test
    void buildSprintStarted_containsKeySprintInformation() {
        User recipient = User.builder().prenom("Alice").nom("Dev").email("alice@agileflow.dev").build();
        Sprint sprint = Sprint.builder()
                .nom("Sprint 6")
                .dateDebut(LocalDate.of(2026, 5, 1))
                .dateFin(LocalDate.of(2026, 5, 14))
                .capacitePoints(24)
                .project(Project.builder().nom("AgileFlow Platform").build())
                .build();

        EmailTemplateService.RenderedEmail email = emailTemplateService.buildSprintStarted(recipient, sprint);

        assertThat(email.subject()).contains("Sprint demarre");
        assertThat(email.html()).contains("Sprint 6");
        assertThat(email.html()).contains("AgileFlow Platform");
        assertThat(email.html()).contains("01/05/2026");
    }

    @Test
    void buildTaskAssigned_containsTaskDetails() {
        User recipient = User.builder().prenom("Bob").nom("Dev").email("bob@agileflow.dev").build();
        Task task = Task.builder()
                .titre("Envoyer les emails")
                .description("Configurer les notifications enrichies.")
                .priorite(Task.Priorite.CRITICAL)
                .statut(Task.Statut.IN_PROGRESS)
                .dateEcheance(LocalDateTime.of(2026, 5, 3, 10, 0))
                .sprint(Sprint.builder().nom("Sprint 6").build())
                .build();

        EmailTemplateService.RenderedEmail email = emailTemplateService.buildTaskAssigned(recipient, task);

        assertThat(email.subject()).contains("Nouvelle tache assignee");
        assertThat(email.html()).contains("Envoyer les emails");
        assertThat(email.html()).contains("CRITICAL");
        assertThat(email.html()).contains("03/05/2026");
    }

    @Test
    void buildUrgentDeadlineAlert_containsProfessionalUrgentContent() {
        User recipient = User.builder().prenom("Alice").nom("Dev").email("alice@agileflow.dev").build();
        Task task = Task.builder()
                .titre("Corriger le Kanban urgent")
                .dateEcheance(LocalDateTime.of(2026, 5, 4, 10, 0))
                .sprint(Sprint.builder().project(Project.builder().nom("AgileFlow Platform").build()).build())
                .build();

        EmailTemplateService.RenderedEmail email = emailTemplateService.buildUrgentDeadlineAlert(
                recipient,
                task,
                "http://localhost:5173/kanban"
        );

        assertThat(email.subject()).contains("Alerte urgente");
        assertThat(email.html()).contains("URGENT");
        assertThat(email.html()).contains("Corriger le Kanban urgent");
        assertThat(email.html()).contains("04/05/2026");
        assertThat(email.html()).contains("AgileFlow Platform");
        assertThat(email.html()).contains("http://localhost:5173/kanban");
    }
}
