package com.agileflow.service;

import com.agileflow.dto.CreateProjectRequest;
import com.agileflow.dto.ProjectDTO;
import com.agileflow.dto.UpdateProjectRequest;
import com.agileflow.entity.ActivityLog;
import com.agileflow.entity.Project;
import com.agileflow.entity.Team;
import com.agileflow.entity.User;
import com.agileflow.exception.BadRequestException;
import com.agileflow.exception.ForbiddenOperationException;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.ProjectMemberRepository;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.SprintRepository;
import com.agileflow.repository.TaskRepository;
import com.agileflow.repository.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final SprintRepository sprintRepository;
    private final TaskRepository taskRepository;
    private final TeamRepository teamRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ActivityLogger activityLogger;
    private final ProjectAccessService projectAccessService;

    public ProjectService(
            ProjectRepository projectRepository,
            SprintRepository sprintRepository,
            TaskRepository taskRepository,
            TeamRepository teamRepository,
            ProjectMemberRepository projectMemberRepository,
            ActivityLogger activityLogger,
            ProjectAccessService projectAccessService) {
        this.projectRepository = projectRepository;
        this.sprintRepository = sprintRepository;
        this.taskRepository = taskRepository;
        this.teamRepository = teamRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.activityLogger = activityLogger;
        this.projectAccessService = projectAccessService;
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

    private Team resolveTeam(Long teamId) {
        if (teamId == null) {
            return null;
        }
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipe introuvable"));
    }

    ProjectDTO toProjectDTO(Project project, User actor) {
        long sprintCount = sprintRepository.findByProjectId(project.getId()).size();
        long taskCount = sprintRepository.findByProjectId(project.getId()).stream()
                .mapToLong(sprint -> taskRepository.findBySprintId(sprint.getId()).size())
                .sum();
        User owner = project.getManager();
        boolean isOwner = owner != null && actor != null && owner.getId().equals(actor.getId());
        long memberCount = projectMemberRepository.countByProject_Id(project.getId());
        Team team = project.getTeam();
        return new ProjectDTO(
                project.getId(),
                project.getNom(),
                project.getDescription(),
                project.getDateDebut() != null ? project.getDateDebut().toString() : null,
                project.getDateFin() != null ? project.getDateFin().toString() : null,
                project.getStatut().name(),
                owner != null ? owner.getId() : null,
                owner != null ? (owner.getPrenom() + " " + owner.getNom()).trim() : null,
                team != null ? team.getId() : null,
                team != null ? team.getName() : null,
                sprintCount,
                taskCount,
                isOwner,
                memberCount
        );
    }

    @Transactional(readOnly = true)
    public List<ProjectDTO> listProjects(String q) {
        User actor = projectAccessService.currentUser();
        String query = (q == null || q.isBlank()) ? null : q.trim().toLowerCase();

        List<Project> projects;
        if (projectAccessService.isPlatformAdmin(actor)) {
            projects = projectRepository.search(query);
        } else {
            Set<Project> accessible = new LinkedHashSet<>(projectRepository.findAccessibleByUserId(actor.getId()));
            projects = accessible.stream()
                    .filter(project -> query == null
                            || project.getNom().toLowerCase().contains(query)
                            || (project.getDescription() != null && project.getDescription().toLowerCase().contains(query)))
                    .toList();
        }

        return projects.stream().map(project -> toProjectDTO(project, actor)).toList();
    }

    @Transactional(readOnly = true)
    public ProjectDTO getProjectById(Long id) {
        Project project = projectAccessService.getProjectOrThrow(id);
        User actor = projectAccessService.currentUser();
        projectAccessService.assertProjectAccess(actor, project);
        return toProjectDTO(project, actor);
    }

    @Transactional
    public ProjectDTO createProject(CreateProjectRequest request) {
        User actor = projectAccessService.currentUser();
        validateDates(request);

        Project project = Project.builder()
                .nom(request.name())
                .description(request.description())
                .dateDebut(request.startDate())
                .dateFin(request.endDate())
                .statut(request.status())
                .manager(actor)
                .team(resolveTeam(request.teamId()))
                .build();
        projectRepository.save(project);
        activityLogger.log(actor, ActivityLog.Action.PROJECT_CREATED, "Projet cree: " + project.getNom(), project, null, null);
        return toProjectDTO(project, actor);
    }

    @Transactional
    public ProjectDTO updateProject(Long id, UpdateProjectRequest request) {
        Project project = projectAccessService.getProjectOrThrow(id);
        User actor = projectAccessService.currentUser();
        projectAccessService.assertCanManageProject(actor, project);
        validateDates(request);

        project.setNom(request.name());
        project.setDescription(request.description());
        project.setDateDebut(request.startDate());
        project.setDateFin(request.endDate());
        project.setStatut(request.status());
        project.setTeam(resolveTeam(request.teamId()));
        projectRepository.save(project);
        activityLogger.log(actor, ActivityLog.Action.PROJECT_UPDATED, "Projet mis a jour: " + project.getNom(), project, null, null);
        return toProjectDTO(project, actor);
    }

    @Transactional
    public void deleteProject(Long id) {
        Project project = projectAccessService.getProjectOrThrow(id);
        User actor = projectAccessService.currentUser();
        projectAccessService.assertCanManageProject(actor, project);
        if (!sprintRepository.findByProjectId(id).isEmpty()) {
            throw new BadRequestException("Impossible de supprimer un projet qui contient deja des sprints.");
        }
        projectRepository.delete(project);
    }
}
