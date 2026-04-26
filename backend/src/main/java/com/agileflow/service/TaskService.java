package com.agileflow.service;

import com.agileflow.dto.*;
import com.agileflow.entity.Project;
import com.agileflow.entity.Sprint;
import com.agileflow.entity.Task;
import com.agileflow.entity.User;
import com.agileflow.entity.UserStory;
import com.agileflow.exception.ForbiddenOperationException;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.SprintRepository;
import com.agileflow.repository.TaskRepository;
import com.agileflow.repository.UserRepository;
import com.agileflow.repository.UserStoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final SprintRepository sprintRepository;
    private final ProjectRepository projectRepository;
    private final UserStoryRepository userStoryRepository;

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

    private Task getTaskOrThrow(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Tâche introuvable"));
    }

    private TaskDTO toDto(Task task) {
        return new TaskDTO(
                task.getId(),
                task.getTitre(),
                task.getDescription(),
                task.getStatut() != null ? task.getStatut().name() : null,
                task.getPriorite() != null ? task.getPriorite().name() : null,
                task.getAssignedTo() != null ? task.getAssignedTo().getId() : null,
                task.getAssignedTo() != null ? task.getAssignedTo().getPrenom() + " " + task.getAssignedTo().getNom() : null,
                task.getSprint() != null ? task.getSprint().getId() : null,
                task.getSprint() != null ? "Sprint " + task.getSprint().getNumero() : null,
                task.getStory() != null ? task.getStory().getId() : null,
                task.getDateEcheance() != null ? task.getDateEcheance().toString() : null,
                task.getLabels() != null ? new HashSet<>(task.getLabels()) : new HashSet<>()
        );
    }

    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksBySprint(Long sprintId) {
        User actor = currentUser();
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint introuvable"));
        if (!canViewProject(actor, sprint.getProject())) {
            throw new ForbiddenOperationException("Vous n'avez pas accès à ce projet");
        }
        return taskRepository.findBySprintId(sprintId).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByProject(Long projectId) {
        User actor = currentUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"));
        if (!canViewProject(actor, project)) {
            throw new ForbiddenOperationException("Vous n'avez pas accès à ce projet");
        }
        return taskRepository.findBySprint_Project_Id(projectId).stream().map(this::toDto).toList();
    }

    @Transactional
    public TaskDTO createTask(CreateTaskRequest request) {
        User actor = currentUser();
        
        // We require a sprint or a story to determine the project.
        Project project = null;
        Sprint sprint = null;
        UserStory story = null;
        
        if (request.sprintId() != null) {
            sprint = sprintRepository.findById(request.sprintId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sprint introuvable"));
            project = sprint.getProject();
        } else if (request.storyId() != null) {
            story = userStoryRepository.findById(request.storyId())
                    .orElseThrow(() -> new ResourceNotFoundException("User story introuvable"));
            project = story.getBacklog().getProject();
            sprint = story.getSprint(); // Default to story's sprint if any
        }
        
        if (project == null) {
            throw new IllegalArgumentException("Un sprintId ou storyId est requis pour créer une tâche");
        }

        if (!canManageProject(actor, project)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas créer de tâche pour ce projet");
        }

        User assignedTo = null;
        if (request.assignedToId() != null) {
            assignedTo = userRepository.findById(request.assignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur assigné introuvable"));
        }

        LocalDate dateEcheance = null;
        if (request.dateEcheance() != null && !request.dateEcheance().isEmpty()) {
            dateEcheance = LocalDate.parse(request.dateEcheance());
        }

        Task task = Task.builder()
                .titre(request.titre())
                .description(request.description())
                .statut(Task.Statut.TODO)
                .priorite(request.priorite() != null ? request.priorite() : Task.Priorite.MEDIUM)
                .sprint(sprint)
                .story(story)
                .assignedTo(assignedTo)
                .dateEcheance(dateEcheance)
                .labels(request.labels() != null ? request.labels() : new HashSet<>())
                .build();

        return toDto(taskRepository.save(task));
    }

    @Transactional
    public TaskDTO updateTask(Long taskId, UpdateTaskRequest request) {
        User actor = currentUser();
        Task task = getTaskOrThrow(taskId);
        Project project = task.getSprint() != null ? task.getSprint().getProject() : 
                          (task.getStory() != null ? task.getStory().getBacklog().getProject() : null);

        if (project != null && !canManageProject(actor, project)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas modifier cette tâche");
        }

        task.setTitre(request.titre());
        task.setDescription(request.description());
        if (request.priorite() != null) {
            task.setPriorite(request.priorite());
        }

        if (request.assignedToId() != null) {
            User assignedTo = userRepository.findById(request.assignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur assigné introuvable"));
            task.setAssignedTo(assignedTo);
        } else {
            task.setAssignedTo(null);
        }

        if (request.dateEcheance() != null && !request.dateEcheance().isEmpty()) {
            task.setDateEcheance(LocalDate.parse(request.dateEcheance()));
        } else {
            task.setDateEcheance(null);
        }
        
        if (request.labels() != null) {
            task.setLabels(new HashSet<>(request.labels()));
        } else {
            task.setLabels(new HashSet<>());
        }

        return toDto(taskRepository.save(task));
    }

    @Transactional
    public void deleteTask(Long taskId) {
        User actor = currentUser();
        Task task = getTaskOrThrow(taskId);
        Project project = task.getSprint() != null ? task.getSprint().getProject() : 
                          (task.getStory() != null ? task.getStory().getBacklog().getProject() : null);

        if (project != null && !canManageProject(actor, project)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas supprimer cette tâche");
        }

        taskRepository.delete(task);
    }

    @Transactional
    public TaskDTO moveTask(Long taskId, MoveTaskRequest request) {
        User actor = currentUser();
        Task task = getTaskOrThrow(taskId);
        Project project = task.getSprint() != null ? task.getSprint().getProject() : 
                          (task.getStory() != null ? task.getStory().getBacklog().getProject() : null);

        // Note: Future improvement: Allow DEVELOPER to move any task in a project they can view, 
        // or restrict strictly to tasks assigned to them.
        // Currently: ADMIN/MANAGER can move any task in their project. 
        // DEVELOPER can only move tasks assigned to them.
        if (project != null) {
            if (!canManageProject(actor, project)) {
                if (actor.getRole() == User.Role.ROLE_DEVELOPER) {
                    if (task.getAssignedTo() == null || !task.getAssignedTo().getId().equals(actor.getId())) {
                        throw new ForbiddenOperationException("Vous ne pouvez déplacer que les tâches qui vous sont assignées");
                    }
                } else {
                    throw new ForbiddenOperationException("Vous n'avez pas les droits pour déplacer cette tâche");
                }
            }
        }

        task.setStatut(request.statut());
        return toDto(taskRepository.save(task));
    }

    @Transactional
    public TaskDTO assignTask(Long taskId, AssignTaskRequest request) {
        User actor = currentUser();
        Task task = getTaskOrThrow(taskId);
        Project project = task.getSprint() != null ? task.getSprint().getProject() : 
                          (task.getStory() != null ? task.getStory().getBacklog().getProject() : null);

        if (project != null && !canManageProject(actor, project)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas assigner cette tâche");
        }

        User assignedTo = userRepository.findById(request.assignedToId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur assigné introuvable"));
        
        task.setAssignedTo(assignedTo);
        return toDto(taskRepository.save(task));
    }
}
