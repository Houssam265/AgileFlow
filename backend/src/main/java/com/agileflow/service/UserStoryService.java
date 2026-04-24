package com.agileflow.service;

import com.agileflow.dto.*;
import com.agileflow.entity.Backlog;
import com.agileflow.entity.Project;
import com.agileflow.entity.Sprint;
import com.agileflow.entity.User;
import com.agileflow.entity.UserStory;
import com.agileflow.exception.ForbiddenOperationException;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.BacklogRepository;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.SprintRepository;
import com.agileflow.repository.UserRepository;
import com.agileflow.repository.UserStoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserStoryService {

    private final UserStoryRepository userStoryRepository;
    private final BacklogRepository backlogRepository;
    private final ProjectRepository projectRepository;
    private final SprintRepository sprintRepository;
    private final UserRepository userRepository;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur courant introuvable"));
    }

    private boolean isAdmin(User user) {
        return user.getRole() == User.Role.ROLE_ADMIN;
    }

    private boolean canViewProject(User actor, Project project) {
        return isAdmin(actor)
                || actor.getRole() == User.Role.ROLE_DEVELOPER
                || (actor.getRole() == User.Role.ROLE_MANAGER && project.getManager() != null
                && project.getManager().getId().equals(actor.getId()));
    }

    private boolean canManageProject(User actor, Project project) {
        return isAdmin(actor)
                || (actor.getRole() == User.Role.ROLE_MANAGER && project.getManager() != null
                && project.getManager().getId().equals(actor.getId()));
    }

    private Project getProjectOrThrow(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"));
    }

    private Backlog getOrCreateBacklog(Project project) {
        return backlogRepository.findByProjectId(project.getId())
                .orElseGet(() -> backlogRepository.save(Backlog.builder().project(project).build()));
    }

    private UserStory getStoryOrThrow(Long storyId) {
        return userStoryRepository.findById(storyId)
                .orElseThrow(() -> new ResourceNotFoundException("User story introuvable"));
    }

    private UserStoryDTO toDto(UserStory story) {
        Sprint sprint = story.getSprint();
        Project project = story.getBacklog().getProject();
        return new UserStoryDTO(
                story.getId(),
                story.getTitre(),
                story.getDescription(),
                story.getPriority().name(),
                story.getStoryPoints(),
                story.getAcceptanceCriteria(),
                story.getBacklog().getId(),
                project.getId(),
                sprint != null ? sprint.getId() : null,
                sprint != null ? "Sprint " + sprint.getNumero() : null,
                story.getCreatedAt() != null ? story.getCreatedAt().toString() : null
        );
    }

    @Transactional
    public BacklogDTO getBacklogByProject(Long projectId, UserStory.Priority priority) {
        User actor = currentUser();
        Project project = getProjectOrThrow(projectId);
        if (!canViewProject(actor, project)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas consulter le backlog de ce projet.");
        }
        Backlog backlog = getOrCreateBacklog(project);
        List<UserStoryDTO> stories = userStoryRepository.findByProjectIdAndPriority(projectId, priority).stream()
                .map(this::toDto)
                .toList();
        return new BacklogDTO(backlog.getId(), project.getId(), project.getNom(), stories);
    }

    @Transactional
    public UserStoryDTO createStory(Long projectId, CreateUserStoryRequest request) {
        User actor = currentUser();
        Project project = getProjectOrThrow(projectId);
        if (!canManageProject(actor, project)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas ajouter une user story a ce projet.");
        }
        Backlog backlog = getOrCreateBacklog(project);
        UserStory story = UserStory.builder()
                .titre(request.title())
                .description(request.description())
                .priority(request.priority())
                .storyPoints(request.storyPoints())
                .acceptanceCriteria(request.acceptanceCriteria())
                .backlog(backlog)
                .build();
        return toDto(userStoryRepository.save(story));
    }

    @Transactional
    public UserStoryDTO updateStory(Long storyId, UpdateUserStoryRequest request) {
        User actor = currentUser();
        UserStory story = getStoryOrThrow(storyId);
        Project project = story.getBacklog().getProject();
        if (!canManageProject(actor, project)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas modifier cette user story.");
        }
        story.setTitre(request.title());
        story.setDescription(request.description());
        story.setPriority(request.priority());
        story.setStoryPoints(request.storyPoints());
        story.setAcceptanceCriteria(request.acceptanceCriteria());
        return toDto(userStoryRepository.save(story));
    }

    @Transactional
    public void deleteStory(Long storyId) {
        User actor = currentUser();
        UserStory story = getStoryOrThrow(storyId);
        if (!canManageProject(actor, story.getBacklog().getProject())) {
            throw new ForbiddenOperationException("Vous ne pouvez pas supprimer cette user story.");
        }
        userStoryRepository.delete(story);
    }

    @Transactional
    public UserStoryDTO assignToSprint(Long storyId, Long sprintId) {
        User actor = currentUser();
        UserStory story = getStoryOrThrow(storyId);
        Project project = story.getBacklog().getProject();
        if (!canManageProject(actor, project)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas planifier cette user story.");
        }
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint introuvable"));
        if (!sprint.getProject().getId().equals(project.getId())) {
            throw new ForbiddenOperationException("Le sprint cible n'appartient pas au meme projet.");
        }
        story.setSprint(sprint);
        return toDto(userStoryRepository.save(story));
    }

    @Transactional
    public UserStoryDTO removeFromSprint(Long storyId) {
        User actor = currentUser();
        UserStory story = getStoryOrThrow(storyId);
        if (!canManageProject(actor, story.getBacklog().getProject())) {
            throw new ForbiddenOperationException("Vous ne pouvez pas deplanifier cette user story.");
        }
        story.setSprint(null);
        return toDto(userStoryRepository.save(story));
    }
}
