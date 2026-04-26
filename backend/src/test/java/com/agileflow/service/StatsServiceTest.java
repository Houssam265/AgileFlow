package com.agileflow.service;

import com.agileflow.dto.StatsDTO;
import com.agileflow.entity.Backlog;
import com.agileflow.entity.Project;
import com.agileflow.entity.Sprint;
import com.agileflow.entity.Task;
import com.agileflow.entity.User;
import com.agileflow.entity.UserStory;
import com.agileflow.repository.BacklogRepository;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.SprintRepository;
import com.agileflow.repository.TaskRepository;
import com.agileflow.repository.UserRepository;
import com.agileflow.repository.UserStoryRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Import(StatsService.class)
class StatsServiceTest {

    @Autowired
    private StatsService statsService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private BacklogRepository backlogRepository;

    @Autowired
    private UserStoryRepository userStoryRepository;

    @Autowired
    private SprintRepository sprintRepository;

    @Autowired
    private TaskRepository taskRepository;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getStats_aggregatesTasksBurndownAndVelocityWithJpql() {
        Fixture fixture = createFixture();
        authenticateAs(fixture.admin());

        StatsDTO stats = statsService.getStats(fixture.project().getId(), fixture.sprint().getId());

        assertThat(stats.totalTasks()).isEqualTo(4);
        assertThat(stats.todoTasks()).isEqualTo(1);
        assertThat(stats.inProgressTasks()).isEqualTo(1);
        assertThat(stats.reviewTasks()).isEqualTo(1);
        assertThat(stats.completedTasks()).isEqualTo(1);
        assertThat(stats.completionRate()).isEqualTo(25.0);
        assertThat(stats.activeSprints()).isEqualTo(1);
        assertThat(stats.burndown()).hasSize(7);
        assertThat(stats.velocity()).hasSize(1);
        assertThat(stats.velocity().getFirst().completedStoryPoints()).isEqualTo(8);
    }

    @Test
    void getStats_limitsDeveloperToAssignedTasks() {
        Fixture fixture = createFixture();
        authenticateAs(fixture.developer());

        StatsDTO stats = statsService.getStats(fixture.project().getId(), fixture.sprint().getId());

        assertThat(stats.totalTasks()).isEqualTo(2);
        assertThat(stats.completedTasks()).isEqualTo(1);
        assertThat(stats.todoTasks()).isEqualTo(1);
        assertThat(stats.inProgressTasks()).isZero();
    }

    private Fixture createFixture() {
        User admin = userRepository.save(User.builder()
                .email("admin.stats@agileflow.dev")
                .prenom("Admin")
                .nom("Root")
                .role(User.Role.ROLE_ADMIN)
                .actif(true)
                .build());
        User manager = userRepository.save(User.builder()
                .email("manager.stats@agileflow.dev")
                .prenom("Sara")
                .nom("Manager")
                .role(User.Role.ROLE_MANAGER)
                .actif(true)
                .build());
        User developer = userRepository.save(User.builder()
                .email("dev.stats@agileflow.dev")
                .prenom("Alice")
                .nom("Dev")
                .role(User.Role.ROLE_DEVELOPER)
                .actif(true)
                .build());

        Project project = projectRepository.save(Project.builder()
                .nom("Stats Project")
                .manager(manager)
                .statut(Project.Statut.ACTIF)
                .build());
        Backlog backlog = backlogRepository.save(Backlog.builder().project(project).build());
        UserStory story = userStoryRepository.save(UserStory.builder()
                .titre("Rapports")
                .priority(UserStory.Priority.HIGH)
                .storyPoints(8)
                .backlog(backlog)
                .build());
        Sprint sprint = sprintRepository.save(Sprint.builder()
                .nom("Sprint Stats")
                .dateDebut(LocalDate.now().minusDays(3))
                .dateFin(LocalDate.now().plusDays(3))
                .project(project)
                .statut(Sprint.Statut.ACTIF)
                .capacitePoints(20)
                .build());

        taskRepository.saveAll(List.of(
                Task.builder()
                        .titre("Done")
                        .statut(Task.Statut.DONE)
                        .sprint(sprint)
                        .story(story)
                        .assignedTo(developer)
                        .dateEcheance(LocalDate.now())
                        .build(),
                Task.builder()
                        .titre("Todo")
                        .statut(Task.Statut.TODO)
                        .sprint(sprint)
                        .story(story)
                        .assignedTo(developer)
                        .dateEcheance(LocalDate.now().plusDays(1))
                        .build(),
                Task.builder()
                        .titre("In progress")
                        .statut(Task.Statut.IN_PROGRESS)
                        .sprint(sprint)
                        .story(story)
                        .assignedTo(manager)
                        .dateEcheance(LocalDate.now().plusDays(2))
                        .build(),
                Task.builder()
                        .titre("Review")
                        .statut(Task.Statut.REVIEW)
                        .sprint(sprint)
                        .story(story)
                        .assignedTo(manager)
                        .dateEcheance(LocalDate.now().plusDays(3))
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
