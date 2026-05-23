package com.agileflow.service;

import com.agileflow.dto.CreateProjectRequest;
import com.agileflow.dto.ProjectDTO;
import com.agileflow.dto.UpdateProjectRequest;
import com.agileflow.entity.Project;
import com.agileflow.entity.Sprint;
import com.agileflow.entity.User;
import com.agileflow.exception.BadRequestException;
import com.agileflow.exception.ForbiddenOperationException;
import com.agileflow.repository.ProjectMemberRepository;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.SprintRepository;
import com.agileflow.repository.TaskRepository;
import com.agileflow.repository.TeamRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private SprintRepository sprintRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private ActivityLogger activityLogger;

    @Mock
    private ProjectAccessService projectAccessService;

    @InjectMocks
    private ProjectService projectService;

    private User owner;
    private User otherUser;
    private Project project;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L)
                .email("owner@agileflow.dev")
                .prenom("Sara")
                .nom("Owner")
                .role(User.Role.ROLE_DEVELOPER)
                .actif(true)
                .build();

        otherUser = User.builder()
                .id(2L)
                .email("other@agileflow.dev")
                .prenom("Lina")
                .nom("Other")
                .role(User.Role.ROLE_DEVELOPER)
                .actif(true)
                .build();

        project = Project.builder()
                .id(10L)
                .nom("Migration API")
                .description("Refonte du module projets")
                .dateDebut(LocalDate.of(2026, 4, 1))
                .dateFin(LocalDate.of(2026, 6, 1))
                .statut(Project.Statut.ACTIF)
                .manager(owner)
                .build();
    }

    @Test
    void createProject_setsCurrentUserAsOwner() {
        when(projectAccessService.currentUser()).thenReturn(owner);
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> {
            Project saved = invocation.getArgument(0);
            saved.setId(99L);
            return saved;
        });
        when(sprintRepository.findByProjectId(99L)).thenReturn(List.of());
        when(projectMemberRepository.countByProject_Id(99L)).thenReturn(0L);

        ProjectDTO dto = projectService.createProject(new CreateProjectRequest(
                "Portail Web",
                "Nouveau projet client",
                LocalDate.of(2026, 5, 1),
                LocalDate.of(2026, 7, 15),
                Project.Statut.ACTIF,
                null,
                null
        ));

        ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
        verify(projectRepository).save(captor.capture());
        Project saved = captor.getValue();

        assertThat(saved.getNom()).isEqualTo("Portail Web");
        assertThat(saved.getManager()).isEqualTo(owner);
        assertThat(dto.id()).isEqualTo(99L);
        assertThat(dto.managerName()).isEqualTo("Sara Owner");
        assertThat(dto.owner()).isTrue();
    }

    @Test
    void updateProject_rejectsNonOwner() {
        when(projectAccessService.getProjectOrThrow(project.getId())).thenReturn(project);
        when(projectAccessService.currentUser()).thenReturn(otherUser);
        doThrow(new ForbiddenOperationException("Seul le proprietaire du projet peut effectuer cette action."))
                .when(projectAccessService).assertCanManageProject(otherUser, project);

        assertThatThrownBy(() -> projectService.updateProject(project.getId(), new UpdateProjectRequest(
                "Migration API v2",
                "Tentative de modification",
                LocalDate.of(2026, 4, 1),
                LocalDate.of(2026, 6, 1),
                Project.Statut.ACTIF,
                null
        ))).isInstanceOf(ForbiddenOperationException.class);

        verify(projectRepository, never()).save(any(Project.class));
    }

    @Test
    void deleteProject_rejectsProjectWithSprints() {
        when(projectAccessService.getProjectOrThrow(project.getId())).thenReturn(project);
        when(projectAccessService.currentUser()).thenReturn(owner);
        when(sprintRepository.findByProjectId(project.getId())).thenReturn(List.of(
                Sprint.builder().id(1L).nom("Sprint 1").project(project).build()
        ));

        assertThatThrownBy(() -> projectService.deleteProject(project.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("sprints");

        verify(projectRepository, never()).delete(any(Project.class));
    }
}
