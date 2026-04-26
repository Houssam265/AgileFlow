package com.agileflow.service;

import com.agileflow.dto.AnalyticsDTO;
import com.agileflow.dto.AnalyticsPeriod;
import com.agileflow.entity.ActivityLog;
import com.agileflow.entity.Project;
import com.agileflow.entity.Sprint;
import com.agileflow.entity.Task;
import com.agileflow.entity.User;
import com.agileflow.repository.ActivityLogRepository;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.SprintRepository;
import com.agileflow.repository.TaskRepository;
import com.agileflow.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Import(AnalyticsService.class)
class AnalyticsServiceTest {

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private SprintRepository sprintRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getAnalytics_aggregatesActivitiesByMemberAndDateWithJpql() {
        Fixture fixture = createFixture();
        authenticateAs(fixture.admin());

        AnalyticsDTO analytics = analyticsService.getAnalytics(AnalyticsPeriod.MONTH, null);

        assertThat(analytics.totalActivities()).isEqualTo(3);
        assertThat(analytics.completedTasks()).isEqualTo(1);
        assertThat(analytics.activeMembers()).isEqualTo(2);
        assertThat(analytics.memberStats()).extracting("memberName")
                .contains("Alice Dev", "Sara Manager");
        assertThat(analytics.heatmap()).filteredOn(day -> day.activityCount() > 0)
                .hasSize(2);
    }

    @Test
    void getAnalytics_limitsManagerToManagedProjects() {
        Fixture fixture = createFixture();
        User otherManager = userRepository.save(User.builder()
                .email("other@agileflow.dev")
                .prenom("Other")
                .nom("Manager")
                .role(User.Role.ROLE_MANAGER)
                .actif(true)
                .build());
        Project otherProject = projectRepository.save(Project.builder()
                .nom("Projet externe")
                .manager(otherManager)
                .statut(Project.Statut.ACTIF)
                .build());
        activityLogRepository.save(ActivityLog.builder()
                .actor(otherManager)
                .project(otherProject)
                .action(ActivityLog.Action.PROJECT_UPDATED)
                .message("Hors perimetre")
                .activityDate(LocalDate.now())
                .createdAt(LocalDateTime.now())
                .build());

        authenticateAs(fixture.manager());

        AnalyticsDTO analytics = analyticsService.getAnalytics(AnalyticsPeriod.MONTH, null);

        assertThat(analytics.totalActivities()).isEqualTo(3);
        assertThat(analytics.memberStats()).extracting("memberName")
                .contains("Sara Manager", "Alice Dev")
                .doesNotContain("Other Manager");
    }

    @Test
    void exportAnalyticsPdf_returnsPdfBytes() {
        Fixture fixture = createFixture();
        authenticateAs(fixture.admin());

        byte[] pdf = analyticsService.exportAnalyticsPdf(AnalyticsPeriod.MONTH, null);

        assertThat(pdf.length).isGreaterThan(100);
        assertThat(new String(Arrays.copyOf(pdf, 4), StandardCharsets.US_ASCII)).isEqualTo("%PDF");
    }

    private Fixture createFixture() {
        User admin = userRepository.save(User.builder()
                .email("admin@agileflow.dev")
                .prenom("Admin")
                .nom("Root")
                .role(User.Role.ROLE_ADMIN)
                .actif(true)
                .build());
        User manager = userRepository.save(User.builder()
                .email("manager@agileflow.dev")
                .prenom("Sara")
                .nom("Manager")
                .role(User.Role.ROLE_MANAGER)
                .actif(true)
                .build());
        User developer = userRepository.save(User.builder()
                .email("alice@agileflow.dev")
                .prenom("Alice")
                .nom("Dev")
                .role(User.Role.ROLE_DEVELOPER)
                .actif(true)
                .build());
        Project project = projectRepository.save(Project.builder()
                .nom("AgileFlow")
                .manager(manager)
                .statut(Project.Statut.ACTIF)
                .build());
        Sprint sprint = sprintRepository.save(Sprint.builder()
                .nom("Sprint Analytics")
                .dateDebut(LocalDate.now().minusDays(5))
                .dateFin(LocalDate.now().plusDays(5))
                .project(project)
                .statut(Sprint.Statut.ACTIF)
                .build());
        Task task = taskRepository.save(Task.builder()
                .titre("Construire analytics")
                .sprint(sprint)
                .assignedTo(developer)
                .statut(Task.Statut.DONE)
                .build());
        activityLogRepository.saveAll(List.of(
                ActivityLog.builder()
                        .actor(developer)
                        .project(project)
                        .sprint(sprint)
                        .task(task)
                        .action(ActivityLog.Action.TASK_MOVED)
                        .message("En cours")
                        .activityDate(LocalDate.now().minusDays(1))
                        .createdAt(LocalDateTime.now().minusDays(1))
                        .build(),
                ActivityLog.builder()
                        .actor(developer)
                        .project(project)
                        .sprint(sprint)
                        .task(task)
                        .action(ActivityLog.Action.TASK_COMPLETED)
                        .message("Terminee")
                        .activityDate(LocalDate.now())
                        .createdAt(LocalDateTime.now())
                        .build(),
                ActivityLog.builder()
                        .actor(manager)
                        .project(project)
                        .sprint(sprint)
                        .action(ActivityLog.Action.STORY_PLANNED)
                        .message("Planification")
                        .activityDate(LocalDate.now())
                        .createdAt(LocalDateTime.now())
                        .build()
        ));
        return new Fixture(admin, manager, developer, project, sprint);
    }

    private void authenticateAs(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user.getEmail(), null, List.of())
        );
    }

    private record Fixture(User admin, User manager, User developer, Project project, Sprint sprint) {
    }
}
