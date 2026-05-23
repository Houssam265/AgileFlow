package com.agileflow.service;

import com.agileflow.entity.Project;
import com.agileflow.entity.User;
import com.agileflow.exception.ForbiddenOperationException;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.ProjectMemberRepository;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectAccessService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur courant introuvable"));
    }

    public boolean isPlatformAdmin(User user) {
        return user.getRole() == User.Role.ROLE_ADMIN;
    }

    public boolean isProjectOwner(User user, Project project) {
        return project.getManager() != null && project.getManager().getId().equals(user.getId());
    }

    @Transactional(readOnly = true)
    public boolean isProjectMember(User user, Long projectId) {
        return projectMemberRepository.existsByProject_IdAndUser_Id(projectId, user.getId());
    }

    @Transactional(readOnly = true)
    public boolean hasProjectAccess(User user, Project project) {
        if (isPlatformAdmin(user)) {
            return true;
        }
        return isProjectOwner(user, project) || isProjectMember(user, project.getId());
    }

    @Transactional(readOnly = true)
    public boolean canManageProject(User user, Project project) {
        return isPlatformAdmin(user) || isProjectOwner(user, project);
    }

    @Transactional(readOnly = true)
    public Project getProjectOrThrow(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"));
    }

    public void assertProjectAccess(User user, Project project) {
        if (!hasProjectAccess(user, project)) {
            throw new ForbiddenOperationException("Vous n'avez pas acces a ce projet.");
        }
    }

    public void assertCanManageProject(User user, Project project) {
        if (!canManageProject(user, project)) {
            throw new ForbiddenOperationException("Seul le proprietaire du projet peut effectuer cette action.");
        }
    }
}
