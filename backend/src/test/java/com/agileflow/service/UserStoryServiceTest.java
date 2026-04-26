package com.agileflow.service;

import com.agileflow.dto.BacklogDTO;
import com.agileflow.dto.CreateUserStoryRequest;
import com.agileflow.dto.UpdateUserStoryRequest;
import com.agileflow.dto.UserStoryDTO;
import com.agileflow.entity.Backlog;
import com.agileflow.entity.Project;
import com.agileflow.entity.Sprint;
import com.agileflow.entity.User;
import com.agileflow.entity.UserStory;
import com.agileflow.exception.ForbiddenOperationException;
import com.agileflow.repository.BacklogRepository;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.SprintRepository;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserStoryServiceTest {

    @Mock
    private UserStoryRepository userStoryRepository;

    @Mock
    private BacklogRepository backlogRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private SprintRepository sprintRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserStoryService userStoryService;

    private User manager;
    private User developer;
    private Project project;
    private Backlog backlog;
    private UserStory story;

    @BeforeEach
    void setUp() {
        manager = User.builder()
                .id(10L)
                .email("manager@agileflow.dev")
                .prenom("Sara")
                .nom("Manager")
                .role(User.Role.ROLE_MANAGER)
                .actif(true)
                .build();

        developer = User.builder()
                .id(20L)
                .email("dev@agileflow.dev")
                .prenom("Dev")
                .nom("User")
                .role(User.Role.ROLE_DEVELOPER)
                .actif(true)
                .build();

        project = Project.builder()
                .id(100L)
                .nom("AgileFlow Web")
                .manager(manager)
                .statut(Project.Statut.ACTIF)
                .build();

        backlog = Backlog.builder()
                .id(200L)
                .project(project)
                .build();

        story = UserStory.builder()
                .id(300L)
                .titre("Configurer le backlog")
                .description("Ajout CRUD")
                .priority(UserStory.Priority.HIGH)
                .storyPoints(5)
                .acceptanceCriteria("Liste et edition")
                .createdAt(LocalDateTime.of(2026, 4, 24, 12, 0))
                .backlog(backlog)
                .build();
    }

    @Test
    void getBacklog_filtersByPriority() {
        authenticateAs(developer);
        when(userRepository.findByEmail(developer.getEmail())).thenReturn(Optional.of(developer));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(backlogRepository.findByProjectId(project.getId())).thenReturn(Optional.of(backlog));
        when(userStoryRepository.findByProjectIdAndPriority(project.getId(), UserStory.Priority.HIGH)).thenReturn(List.of(story));

        BacklogDTO dto = userStoryService.getBacklogByProject(project.getId(), UserStory.Priority.HIGH);

        assertThat(dto.projectName()).isEqualTo("AgileFlow Web");
        assertThat(dto.stories()).hasSize(1);
        assertThat(dto.stories().getFirst().priority()).isEqualTo("HIGH");
    }

    @Test
    void createStory_rejectsDeveloper() {
        authenticateAs(developer);
        when(userRepository.findByEmail(developer.getEmail())).thenReturn(Optional.of(developer));
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));

        assertThatThrownBy(() -> userStoryService.createStory(project.getId(), new CreateUserStoryRequest(
                "Story",
                "Description",
                UserStory.Priority.MEDIUM,
                3,
                "Critere"
        )))
                .isInstanceOf(ForbiddenOperationException.class)
                .hasMessageContaining("ajouter");

        verify(userStoryRepository, never()).save(any(UserStory.class));
    }

    @Test
    void assignToSprint_linksStoryWhenSprintBelongsToProject() {
        authenticateAs(manager);
        Sprint sprint = Sprint.builder()
                .id(400L)
                .nom("Sprint 2")
                .project(project)
                .build();
        when(userRepository.findByEmail(manager.getEmail())).thenReturn(Optional.of(manager));
        when(userStoryRepository.findById(story.getId())).thenReturn(Optional.of(story));
        when(sprintRepository.findById(sprint.getId())).thenReturn(Optional.of(sprint));
        when(userStoryRepository.save(any(UserStory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserStoryDTO dto = userStoryService.assignToSprint(story.getId(), sprint.getId());

        assertThat(dto.sprintId()).isEqualTo(400L);
        assertThat(dto.sprintLabel()).isEqualTo("Sprint 2");
        assertThat(story.getSprint()).isEqualTo(sprint);
    }

    @Test
    void updateStory_updatesFields() {
        authenticateAs(manager);
        when(userRepository.findByEmail(manager.getEmail())).thenReturn(Optional.of(manager));
        when(userStoryRepository.findById(story.getId())).thenReturn(Optional.of(story));
        when(userStoryRepository.save(any(UserStory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserStoryDTO dto = userStoryService.updateStory(story.getId(), new UpdateUserStoryRequest(
                "Story revue",
                "Description mise a jour",
                UserStory.Priority.CRITICAL,
                8,
                "Critere precise"
        ));

        assertThat(dto.title()).isEqualTo("Story revue");
        assertThat(dto.priority()).isEqualTo("CRITICAL");
        assertThat(dto.storyPoints()).isEqualTo(8);
    }

    private void authenticateAs(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user.getEmail(), null, List.of())
        );
    }
}
