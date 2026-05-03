package com.agileflow.service;

import com.agileflow.dto.CreateDiagramRequest;
import com.agileflow.dto.DiagramDTO;
import com.agileflow.dto.UpdateDiagramRequest;
import com.agileflow.entity.Diagram;
import com.agileflow.entity.Notification;
import com.agileflow.entity.Project;
import com.agileflow.entity.User;
import com.agileflow.exception.ForbiddenOperationException;
import com.agileflow.repository.DiagramRepository;
import com.agileflow.repository.NotificationRepository;
import com.agileflow.repository.ProjectRepository;
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
class DiagramServiceTest {

    @Mock
    private DiagramRepository diagramRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private DiagramService diagramService;

    private User manager;
    private User developer;
    private User otherDeveloper;
    private Project project;

    @BeforeEach
    void setUp() {
        manager = User.builder()
                .id(1L)
                .email("manager@agileflow.dev")
                .prenom("Sara")
                .nom("Manager")
                .role(User.Role.ROLE_MANAGER)
                .build();
        developer = User.builder()
                .id(2L)
                .email("dev@agileflow.dev")
                .prenom("Ali")
                .nom("Dev")
                .role(User.Role.ROLE_DEVELOPER)
                .build();
        otherDeveloper = User.builder()
                .id(3L)
                .email("other@agileflow.dev")
                .prenom("Lina")
                .nom("Dev")
                .role(User.Role.ROLE_DEVELOPER)
                .build();
        project = Project.builder()
                .id(10L)
                .nom("AgileFlow Platform")
                .dateDebut(LocalDate.of(2026, 4, 1))
                .manager(manager)
                .build();
    }

    @Test
    void createDiagram_persistsStepsAndNotifiesProjectMembersWhenShared() {
        authenticateAs(manager);
        when(userRepository.findByEmail(manager.getEmail())).thenReturn(Optional.of(manager));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(taskRepository.findDistinctAssigneesByProjectId(project.getId())).thenReturn(List.of(developer));
        when(diagramRepository.save(any(Diagram.class))).thenAnswer(invocation -> {
            Diagram saved = invocation.getArgument(0);
            saved.setId(99L);
            return saved;
        });

        DiagramDTO dto = diagramService.createDiagram(new CreateDiagramRequest(
                "Workflow release",
                Diagram.Type.FLOWCHART,
                project.getId(),
                null, // taskId
                List.of("Backlog", "Developpement", "Review"),
                null, // json
                true
        ));

        ArgumentCaptor<Diagram> diagramCaptor = ArgumentCaptor.forClass(Diagram.class);
        verify(diagramRepository).save(diagramCaptor.capture());
        assertThat(diagramCaptor.getValue().getEtapesJson()).contains("Backlog", "Review");
        assertThat(diagramCaptor.getValue().getJson()).contains("flowchart TD");
        assertThat(dto.id()).isEqualTo(99L);
        assertThat(dto.etapes()).containsExactly("Backlog", "Developpement", "Review");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Iterable<Notification>> notificationCaptor = ArgumentCaptor.forClass(Iterable.class);
        verify(notificationRepository).saveAll(notificationCaptor.capture());
        assertThat(notificationCaptor.getValue())
                .hasSize(1)
                .allSatisfy(notification -> {
                    assertThat(notification.getUser()).isEqualTo(developer);
                    assertThat(notification.getMessage()).contains("Diagramme partage");
                });
    }

    @Test
    void updateDiagram_rejectsUserWhoIsNotOwnerOrProjectManager() {
        Diagram diagram = Diagram.builder()
                .id(20L)
                .titre("Roadmap")
                .type(Diagram.Type.PROCESS)
                .project(project)
                .owner(manager)
                .etapesJson("[\"Plan\"]")
                .json("{\"mermaid\":\"flowchart TD\"}")
                .shared(false)
                .build();

        authenticateAs(otherDeveloper);
        when(userRepository.findByEmail(otherDeveloper.getEmail())).thenReturn(Optional.of(otherDeveloper));
        when(diagramRepository.findWithRelationsById(diagram.getId())).thenReturn(Optional.of(diagram));

        assertThatThrownBy(() -> diagramService.updateDiagram(diagram.getId(), new UpdateDiagramRequest(
                "Roadmap v2",
                Diagram.Type.PROCESS,
                List.of("Plan", "Build"),
                null,
                false
        )))
                .isInstanceOf(ForbiddenOperationException.class)
                .hasMessageContaining("modifier");

        verify(diagramRepository, never()).save(any(Diagram.class));
        verify(notificationRepository, never()).saveAll(any());
    }

    private void authenticateAs(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user.getEmail(), null, List.of())
        );
    }
}
