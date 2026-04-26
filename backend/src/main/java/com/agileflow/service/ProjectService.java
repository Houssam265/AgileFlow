package com.agileflow.service;

import com.agileflow.dto.CreateProjectRequest;
import com.agileflow.dto.ProjectDTO;
import com.agileflow.dto.UpdateProjectRequest;
import com.agileflow.entity.ActivityLog;
import com.agileflow.entity.Project;
import com.agileflow.entity.User;
import com.agileflow.exception.BadRequestException;
import com.agileflow.exception.ForbiddenOperationException;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.SprintRepository;
import com.agileflow.repository.TaskRepository;
import com.agileflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final SprintRepository sprintRepository;
    private final TaskRepository taskRepository;
    private final ActivityLogger activityLogger;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur courant introuvable"));
    }

    private boolean isAdmin(User user) {
        return user.getRole() == User.Role.ROLE_ADMIN;
    }

    private boolean canManageProject(User actor, Project project) {
        return isAdmin(actor)
                || (actor.getRole() == User.Role.ROLE_MANAGER && project.getManager().getId().equals(actor.getId()));
    }

    private User validateManager(Long managerId) {
        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager introuvable"));
        if (manager.getRole() != User.Role.ROLE_ADMIN && manager.getRole() != User.Role.ROLE_MANAGER) {
            throw new BadRequestException("Le manager doit avoir le role ADMIN ou MANAGER.");
        }
        return manager;
    }

    private void validateDates(CreateProjectRequest request) {
        if (request.endDate() != null && request.endDate().isBefore(request.startDate())) {
            throw new BadRequestException("La date de fin doit etre posterieure a la date de debut.");
        }
    }

    private void validateDates(UpdateProjectRequest request) {
        if (request.endDate() != null && request.endDate().isBefore(request.startDate())) {
            throw new BadRequestException("La date de fin doit etre posterieure a la date de debut.");
        }
    }

    ProjectDTO toProjectDTO(Project project) {
        long sprintCount = sprintRepository.findByProjectId(project.getId()).size();
        long taskCount = sprintRepository.findByProjectId(project.getId()).stream()
                .mapToLong(sprint -> taskRepository.findBySprintId(sprint.getId()).size())
                .sum();
        User manager = project.getManager();
        return new ProjectDTO(
                project.getId(),
                project.getNom(),
                project.getDescription(),
                project.getDateDebut() != null ? project.getDateDebut().toString() : null,
                project.getDateFin() != null ? project.getDateFin().toString() : null,
                project.getStatut().name(),
                manager != null ? manager.getId() : null,
                manager != null ? (manager.getPrenom() + " " + manager.getNom()).trim() : null,
                sprintCount,
                taskCount
        );
    }

    @Transactional(readOnly = true)
    public List<ProjectDTO> listProjects(String q) {
        User actor = currentUser();
        String query = (q == null || q.isBlank()) ? null : q.trim();
        List<Project> projects = isAdmin(actor) || actor.getRole() == User.Role.ROLE_DEVELOPER
                ? projectRepository.search(query)
                : projectRepository.findByManagerId(actor.getId()).stream()
                    .filter(project -> query == null
                            || project.getNom().toLowerCase().contains(query.toLowerCase())
                            || (project.getDescription() != null && project.getDescription().toLowerCase().contains(query.toLowerCase())))
                    .toList();
        return projects.stream().map(this::toProjectDTO).toList();
    }

    @Transactional(readOnly = true)
    public ProjectDTO getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"));
        return toProjectDTO(project);
    }

    @Transactional
    public ProjectDTO createProject(CreateProjectRequest request) {
        User actor = currentUser();
        if (!isAdmin(actor) && actor.getRole() != User.Role.ROLE_MANAGER) {
            throw new ForbiddenOperationException("Seuls les administrateurs et managers peuvent creer un projet.");
        }
        validateDates(request);
        User manager = validateManager(request.managerId());
        if (actor.getRole() == User.Role.ROLE_MANAGER && !actor.getId().equals(manager.getId())) {
            throw new ForbiddenOperationException("Un manager ne peut creer qu'un projet dont il est responsable.");
        }

        Project project = Project.builder()
                .nom(request.name())
                .description(request.description())
                .dateDebut(request.startDate())
                .dateFin(request.endDate())
                .statut(request.status())
                .manager(manager)
                .build();
        projectRepository.save(project);
        activityLogger.log(actor, ActivityLog.Action.PROJECT_CREATED, "Projet cree: " + project.getNom(), project, null, null);
        return toProjectDTO(project);
    }

    @Transactional
    public ProjectDTO updateProject(Long id, UpdateProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"));
        User actor = currentUser();
        if (!canManageProject(actor, project)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas modifier ce projet.");
        }
        validateDates(request);
        User manager = validateManager(request.managerId());
        if (actor.getRole() == User.Role.ROLE_MANAGER && !actor.getId().equals(manager.getId())) {
            throw new ForbiddenOperationException("Un manager ne peut pas transferer un projet a un autre responsable.");
        }

        project.setNom(request.name());
        project.setDescription(request.description());
        project.setDateDebut(request.startDate());
        project.setDateFin(request.endDate());
        project.setStatut(request.status());
        project.setManager(manager);
        projectRepository.save(project);
        activityLogger.log(actor, ActivityLog.Action.PROJECT_UPDATED, "Projet mis a jour: " + project.getNom(), project, null, null);
        return toProjectDTO(project);
    }

    @Transactional
    public void deleteProject(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"));
        User actor = currentUser();
        if (!canManageProject(actor, project)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas supprimer ce projet.");
        }
        if (!sprintRepository.findByProjectId(id).isEmpty()) {
            throw new BadRequestException("Impossible de supprimer un projet qui contient deja des sprints.");
        }
        projectRepository.delete(project);
    }
}
