package com.agileflow.service;

import com.agileflow.dto.DashboardStatsDTO;
import com.agileflow.entity.Project;
import com.agileflow.entity.Sprint;
import com.agileflow.entity.Task;
import com.agileflow.entity.User;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.SprintRepository;
import com.agileflow.repository.TaskRepository;
import com.agileflow.repository.TeamMemberRepository;
import com.agileflow.repository.TeamRepository;
import com.agileflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ProjectRepository projectRepository;
    private final SprintRepository sprintRepository;
    private final TaskRepository taskRepository;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur courant introuvable"));
    }

    @Transactional(readOnly = true)
    public DashboardStatsDTO getStats() {
        User actor = currentUser();

        long totalUsers = actor.getRole() == User.Role.ROLE_ADMIN ? userRepository.count() : 0;
        long activeUsers = actor.getRole() == User.Role.ROLE_ADMIN
                ? userRepository.findAll().stream().filter(User::isActif).count()
                : 0;
        long totalTeams = actor.getRole() == User.Role.ROLE_ADMIN ? teamRepository.count() : teamMemberRepository.findByUser_Id(actor.getId()).size();
        long managedTeams = (actor.getRole() == User.Role.ROLE_ADMIN || actor.getRole() == User.Role.ROLE_MANAGER)
                ? teamRepository.countByManager_Id(actor.getId())
                : 0;
        long totalProjects = actor.getRole() == User.Role.ROLE_ADMIN ? projectRepository.count() : projectRepository.findByManagerId(actor.getId()).size();
        long managedProjects = (actor.getRole() == User.Role.ROLE_ADMIN || actor.getRole() == User.Role.ROLE_MANAGER)
                ? projectRepository.countByManager_Id(actor.getId())
                : 0;
        long activeProjects = actor.getRole() == User.Role.ROLE_ADMIN
                ? projectRepository.countByStatut(Project.Statut.ACTIF)
                : projectRepository.countByManager_IdAndStatut(actor.getId(), Project.Statut.ACTIF);
        long activeSprints = actor.getRole() == User.Role.ROLE_ADMIN
                ? sprintRepository.countByStatut(Sprint.Statut.ACTIF)
                : sprintRepository.countByProject_Manager_IdAndStatut(actor.getId(), Sprint.Statut.ACTIF);
        long totalTasks = actor.getRole() == User.Role.ROLE_DEVELOPER
                ? taskRepository.countByAssignedTo_Id(actor.getId())
                : actor.getRole() == User.Role.ROLE_ADMIN
                    ? taskRepository.count()
                    : taskRepository.countBySprint_Project_Manager_Id(actor.getId());
        long todoTasks = actor.getRole() == User.Role.ROLE_DEVELOPER
                ? taskRepository.countByAssignedTo_IdAndStatut(actor.getId(), Task.Statut.TODO)
                : actor.getRole() == User.Role.ROLE_ADMIN
                    ? taskRepository.countByStatut(Task.Statut.TODO)
                    : taskRepository.countBySprint_Project_Manager_IdAndStatut(actor.getId(), Task.Statut.TODO);
        long inProgressTasks = actor.getRole() == User.Role.ROLE_DEVELOPER
                ? taskRepository.countByAssignedTo_IdAndStatut(actor.getId(), Task.Statut.IN_PROGRESS)
                : actor.getRole() == User.Role.ROLE_ADMIN
                    ? taskRepository.countByStatut(Task.Statut.IN_PROGRESS)
                    : taskRepository.countBySprint_Project_Manager_IdAndStatut(actor.getId(), Task.Statut.IN_PROGRESS);
        long doneTasks = actor.getRole() == User.Role.ROLE_DEVELOPER
                ? taskRepository.countByAssignedTo_IdAndStatut(actor.getId(), Task.Statut.DONE)
                : actor.getRole() == User.Role.ROLE_ADMIN
                    ? taskRepository.countByStatut(Task.Statut.DONE)
                    : taskRepository.countBySprint_Project_Manager_IdAndStatut(actor.getId(), Task.Statut.DONE);

        return new DashboardStatsDTO(
                actor.getRole().name(),
                totalUsers,
                activeUsers,
                totalTeams,
                managedTeams,
                totalProjects,
                managedProjects,
                activeProjects,
                activeSprints,
                totalTasks,
                todoTasks,
                inProgressTasks,
                doneTasks
        );
    }
}
