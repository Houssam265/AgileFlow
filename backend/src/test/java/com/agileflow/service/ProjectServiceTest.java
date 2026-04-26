package com.agileflow.service;

import com.agileflow.dto.CreateProjectRequest;
import com.agileflow.dto.ProjectDTO;
import com.agileflow.dto.UpdateProjectRequest;
import com.agileflow.entity.Project;
import com.agileflow.entity.Sprint;
import com.agileflow.entity.User;
import com.agileflow.exception.BadRequestException;
import com.agileflow.exception.ForbiddenOperationException;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.SprintRepository;
import com.agileflow.repository.TaskRepository;
import com.agileflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SprintRepository sprintRepository;

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private ProjectService projectService;

    private User admin;
    private User manager;
    private Project project;

    @BeforeEach
    void setUp() {
        admin = User.builder()
                .id(1L)
                .email("admin@agileflow.dev")
                .prenom("Admin")
                .nom("Root")
                .role(User.Role.ROLE_ADMIN)
                .actif(true)
                .build();

        manager = User.builder()
                .id(2L)
                .email("manager@agileflow.dev")
                .prenom("Sara")
                .nom("Manager")
                .role(User.Role.ROLE_MANAGER)
                .actif(true)
                .build();

        project = Project.builder()
                .id(10L)
                .nom("Migration API")
                .description("Refonte du module projets")
                .dateDebut(LocalDate.of(2026, 4, 1))
                .dateFin(LocalDate.of(2026, 6, 1))
                .statut(Project.Statut.ACTIF)
                .manager(manager)
                .build();
    }

    @Test
    void createProject_persistsProjectWithValidatedManager() {
        authenticateAs(admin);
        when(userRepository.findByEmail(admin.getEmail())).thenReturn(Optional.of(admin));
        when(userRepository.findById(manager.getId())).thenReturn(Optional.of(manager));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> {
            Project saved = invocation.getArgument(0);
            saved.setId(99L);
            return saved;
        });
        when(sprintRepository.findByProjectId(99L)).thenReturn(List.of());

        ProjectDTO dto = projectService.createProject(new CreateProjectRequest(
                "Portail Web",
                "Nouveau projet client",
                LocalDate.of(2026, 5, 1),
                LocalDate.of(2026, 7, 15),
                Project.Statut.ACTIF,
                manager.getId()
        ));

        ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
        verify(projectRepository).save(captor.capture());
        Project saved = captor.getValue();

        assertThat(saved.getNom()).isEqualTo("Portail Web");
        assertThat(saved.getManager()).isEqualTo(manager);
        assertThat(dto.id()).isEqualTo(99L);
        assertThat(dto.managerName()).isEqualTo("Sara Manager");
    }

    @Test
    void updateProject_rejectsManagerWhoTriesToTransferProject() {
        authenticateAs(manager);
        User otherManager = User.builder()
                .id(3L)
                .email("other@agileflow.dev")
                .prenom("Lina")
                .nom("Other")
                .role(User.Role.ROLE_MANAGER)
                .actif(true)
                .build();
        when(userRepository.findByEmail(manager.getEmail())).thenReturn(Optional.of(manager));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(userRepository.findById(otherManager.getId())).thenReturn(Optional.of(otherManager));

        assertThatThrownBy(() -> projectService.updateProject(project.getId(), new UpdateProjectRequest(
                "Migration API v2",
                "Tentative de transfert",
                LocalDate.of(2026, 4, 1),
                LocalDate.of(2026, 6, 1),
                Project.Statut.ACTIF,
                otherManager.getId()
        )))
                .isInstanceOf(ForbiddenOperationException.class)
                .hasMessageContaining("transferer");

        verify(projectRepository, never()).save(any(Project.class));
    }

    @Test
    void deleteProject_rejectsProjectWithSprints() {
        authenticateAs(admin);
        when(userRepository.findByEmail(admin.getEmail())).thenReturn(Optional.of(admin));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(sprintRepository.findByProjectId(project.getId())).thenReturn(List.of(
                Sprint.builder().id(1L).nom("Sprint 1").project(project).build()
        ));

        assertThatThrownBy(() -> projectService.deleteProject(project.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("sprints");

        verify(projectRepository, never()).delete(any(Project.class));
    }

    private void authenticateAs(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user.getEmail(), null, List.of())
        );
    }
}
