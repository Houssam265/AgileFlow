package com.agileflow.service;

import com.agileflow.dto.*;
import com.agileflow.entity.*;
import com.agileflow.exception.BadRequestException;
import com.agileflow.exception.ForbiddenOperationException;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.*;
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
    private final ActivityLogger activityLogger;
    private final ProjectAccessService projectAccessService;
    private final EpicService epicService;
    private final TaskRepository taskRepository;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur courant introuvable"));
    }

    private boolean canViewProject(User actor, Project project) {
        return projectAccessService.hasProjectAccess(actor, project);
    }

    private boolean canManageProject(User actor, Project project) {
        return projectAccessService.canManageProject(actor, project);
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
        Epic epic = story.getEpic();
        long taskCount = taskRepository.countByStory_Id(story.getId());
        long completedTaskCount = taskRepository.countByStory_IdAndStatut(story.getId(), Task.Statut.DONE);
        boolean done = taskCount > 0 && completedTaskCount == taskCount;
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
                sprint != null ? sprint.getNom() : null,
                epic != null ? epic.getId() : null,
                epic != null ? epic.getTitre() : null,
                epic != null ? epic.getColor() : null,
                taskCount,
                completedTaskCount,
                done,
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
        List<EpicDTO> epics = epicService.listByProject(projectId);
        List<UserStoryDTO> stories = userStoryRepository.findByProjectIdAndPriority(projectId, priority).stream()
                .map(this::toDto)
                .toList();
        return new BacklogDTO(backlog.getId(), project.getId(), project.getNom(), epics, stories);
    }

    @Transactional
    public UserStoryDTO createStory(Long projectId, CreateUserStoryRequest request) {
        User actor = currentUser();
        Project project = getProjectOrThrow(projectId);
        if (!canManageProject(actor, project)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas ajouter une user story a ce projet.");
        }
        Backlog backlog = getOrCreateBacklog(project);
        Epic epic = epicService.resolveEpicForProject(request.epicId(), project);
        UserStory story = UserStory.builder()
                .titre(request.title())
                .description(request.description())
                .priority(request.priority())
                .storyPoints(request.storyPoints())
                .acceptanceCriteria(request.acceptanceCriteria())
                .backlog(backlog)
                .epic(epic)
                .build();
        UserStory saved = userStoryRepository.save(story);
        activityLogger.log(actor, ActivityLog.Action.STORY_CREATED, "User story creee: " + saved.getTitre(), project, null, null);
        return toDto(saved);
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
        story.setEpic(epicService.resolveEpicForProject(request.epicId(), project));
        UserStory saved = userStoryRepository.save(story);
        activityLogger.log(actor, ActivityLog.Action.STORY_UPDATED, "User story mise a jour: " + saved.getTitre(), project, saved.getSprint(), null);
        return toDto(saved);
    }

    @Transactional
    public void deleteStory(Long storyId) {
        User actor = currentUser();
        UserStory story = getStoryOrThrow(storyId);
        if (!canManageProject(actor, story.getBacklog().getProject())) {
            throw new ForbiddenOperationException("Vous ne pouvez pas supprimer cette user story.");
        }
        activityLogger.log(actor, ActivityLog.Action.STORY_DELETED, "User story supprimee: " + story.getTitre(), story.getBacklog().getProject(), story.getSprint(), null);
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
        if (sprint.getStatut() == Sprint.Statut.FERME) {
            throw new BadRequestException("Impossible d'ajouter une story a un sprint ferme.");
        }
        assertSprintCapacity(sprint, story);
        story.setSprint(sprint);
        UserStory saved = userStoryRepository.save(story);
        activityLogger.log(actor, ActivityLog.Action.STORY_PLANNED, "User story planifiee: " + saved.getTitre(), project, sprint, null);
        return toDto(saved);
    }

    @Transactional
    public UserStoryDTO removeFromSprint(Long storyId) {
        User actor = currentUser();
        UserStory story = getStoryOrThrow(storyId);
        if (!canManageProject(actor, story.getBacklog().getProject())) {
            throw new ForbiddenOperationException("Vous ne pouvez pas deplanifier cette user story.");
        }
        Sprint previousSprint = story.getSprint();
        story.setSprint(null);
        UserStory saved = userStoryRepository.save(story);
        activityLogger.log(actor, ActivityLog.Action.STORY_UNPLANNED, "User story deplanifiee: " + saved.getTitre(), saved.getBacklog().getProject(), previousSprint, null);
        return toDto(saved);
    }

    private void assertSprintCapacity(Sprint sprint, UserStory story) {
        if (sprint.getCapacitePoints() == null || sprint.getCapacitePoints() <= 0) {
            return;
        }
        if (story.getSprint() != null && story.getSprint().getId().equals(sprint.getId())) {
            return;
        }
        int storyPoints = story.getStoryPoints() != null ? story.getStoryPoints() : 0;
        int usedPoints = userStoryRepository.findBySprint_Id(sprint.getId()).stream()
                .filter(s -> story.getSprint() == null || !s.getId().equals(story.getId()))
                .map(UserStory::getStoryPoints)
                .filter(p -> p != null)
                .mapToInt(Integer::intValue)
                .sum();
        if (usedPoints + storyPoints > sprint.getCapacitePoints()) {
            throw new BadRequestException(
                    "Capacite du sprint depassee (" + usedPoints + "+" + storyPoints
                            + " > " + sprint.getCapacitePoints() + " pts).");
        }
    }
}
