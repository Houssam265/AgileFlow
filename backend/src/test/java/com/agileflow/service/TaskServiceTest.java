package com.agileflow.service;

import com.agileflow.dto.AssignTaskRequest;
import com.agileflow.dto.CreateTaskRequest;
import com.agileflow.dto.TaskDTO;
import com.agileflow.entity.Project;
import com.agileflow.entity.Sprint;
import com.agileflow.entity.Task;
import com.agileflow.entity.User;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.SprintRepository;
import com.agileflow.repository.TaskRepository;
import com.agileflow.repository.UserRepository;
import com.agileflow.repository.UserStoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SprintRepository sprintRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private UserStoryRepository userStoryRepository;
    @Mock
    private ActivityLogger activityLogger;
    @Mock
    private EmailNotificationService emailNotificationService;
    @Mock
    private ProjectAccessService projectAccessService;

    @InjectMocks
    private TaskService taskService;

    private User manager;
    private User developer;
    private Project project;
    private Sprint sprint;
    private Task task;

    @BeforeEach
    void setUp() {
        manager = User.builder()
                .id(1L)
                .email("manager@agileflow.dev")
                .prenom("Sara")
                .nom("Manager")
                .role(User.Role.ROLE_MANAGER)
                .actif(true)
                .build();
        developer = User.builder()
                .id(2L)
                .email("dev@agileflow.dev")
                .prenom("Alice")
                .nom("Dev")
                .role(User.Role.ROLE_DEVELOPER)
                .actif(true)
                .build();
        project = Project.builder()
                .id(10L)
                .nom("AgileFlow Platform")
                .manager(manager)
                .statut(Project.Statut.ACTIF)
                .build();
        sprint = Sprint.builder()
                .id(20L)
                .nom("Sprint 6")
                .project(project)
                .build();
        task = Task.builder()
                .id(30L)
                .titre("Mettre a jour les emails")
                .description("Brancher les templates")
                .priorite(Task.Priorite.HIGH)
                .statut(Task.Statut.TODO)
                .sprint(sprint)
                .assignedTo(manager)
                .labels(Set.of("Backend"))
                .build();
    }

    @Test
    void createTask_sendsAssignmentEmailWhenAssigneeExists() {
        authenticateAs(manager);
        when(userRepository.findByEmail(manager.getEmail())).thenReturn(Optional.of(manager));
        when(sprintRepository.findById(sprint.getId())).thenReturn(Optional.of(sprint));
        when(userRepository.findById(developer.getId())).thenReturn(Optional.of(developer));
        when(projectAccessService.canManageProject(manager, project)).thenReturn(true);
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
            Task saved = invocation.getArgument(0);
            saved.setId(99L);
            return saved;
        });

        TaskDTO dto = taskService.createTask(new CreateTaskRequest(
                "Configurer les preferences",
                "CRUD preferences email",
                Task.Priorite.HIGH,
                sprint.getId(),
                developer.getId(),
                null,
                "2026-05-04",
                Set.of("Email")
        ));

        assertThat(dto.assignedToId()).isEqualTo(developer.getId());
        verify(emailNotificationService).sendTaskAssigned(any(Task.class));
    }

    @Test
    void assignTask_sendsAssignmentEmail() {
        authenticateAs(manager);
        when(userRepository.findByEmail(manager.getEmail())).thenReturn(Optional.of(manager));
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(userRepository.findById(developer.getId())).thenReturn(Optional.of(developer));
        when(projectAccessService.canManageProject(manager, project)).thenReturn(true);
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TaskDTO dto = taskService.assignTask(task.getId(), new AssignTaskRequest(developer.getId()));

        assertThat(dto.assignedToId()).isEqualTo(developer.getId());
        verify(emailNotificationService).sendTaskAssigned(task);
    }

    private void authenticateAs(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user.getEmail(), null, List.of())
        );
    }
}
