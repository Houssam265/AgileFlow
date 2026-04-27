package com.agileflow.service;

import com.agileflow.dto.SprintDTO;
import com.agileflow.entity.Project;
import com.agileflow.entity.Sprint;
import com.agileflow.entity.User;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.SprintRepository;
import com.agileflow.repository.UserRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SprintServiceTest {

    @Mock
    private SprintRepository sprintRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ActivityLogger activityLogger;
    @Mock
    private EmailNotificationService emailNotificationService;

    @InjectMocks
    private SprintService sprintService;

    private User manager;
    private Project project;
    private Sprint sprint;

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
        project = Project.builder()
                .id(5L)
                .nom("AgileFlow Platform")
                .manager(manager)
                .statut(Project.Statut.ACTIF)
                .build();
        sprint = Sprint.builder()
                .id(7L)
                .nom("Sprint 6")
                .project(project)
                .statut(Sprint.Statut.PLANIFIE)
                .build();
    }

    @Test
    void startSprint_sendsSprintStartEmails() {
        authenticateAs(manager);
        when(userRepository.findByEmail(manager.getEmail())).thenReturn(Optional.of(manager));
        when(sprintRepository.findById(sprint.getId())).thenReturn(Optional.of(sprint));
        when(sprintRepository.save(sprint)).thenReturn(sprint);

        SprintDTO dto = sprintService.startSprint(sprint.getId());

        assertThat(dto.getStatut()).isEqualTo("EN_COURS");
        verify(emailNotificationService).sendSprintStarted(sprint);
    }

    private void authenticateAs(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user.getEmail(), null, List.of())
        );
    }
}
