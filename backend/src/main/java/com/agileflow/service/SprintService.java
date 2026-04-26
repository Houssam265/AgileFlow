package com.agileflow.service;

import com.agileflow.dto.SprintDTO;
import com.agileflow.entity.ActivityLog;
import com.agileflow.entity.Project;
import com.agileflow.entity.Sprint;
import com.agileflow.entity.User;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.SprintRepository;
import com.agileflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SprintService {

    private final SprintRepository sprintRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ActivityLogger activityLogger;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur courant introuvable"));
    }

    @Transactional(readOnly = true)
    public List<SprintDTO> getSprintsByProject(Long projectId) {
        return sprintRepository.findByProjectId(projectId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public SprintDTO createSprint(SprintDTO dto) {
        User actor = currentUser();
        Project project = projectRepository.findById(dto.getProjetId())
                .orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"));

        Sprint sprint = Sprint.builder()
                .nom(dto.getNom())
                .description(dto.getDescription())
                .dateDebut(dto.getDateDebut())
                .dateFin(dto.getDateFin())
                .capacitePoints(dto.getCapacitePoints())
                .pointsUtilises(0)
                .statut(Sprint.Statut.PLANIFIE)
                .project(project)
                .build();

        Sprint saved = sprintRepository.save(sprint);
        activityLogger.log(actor, ActivityLog.Action.SPRINT_CREATED, "Sprint planifie: " + saved.getNom(), project, saved, null);
        return toDto(saved);
    }

    @Transactional
    public SprintDTO updateSprint(Long id, SprintDTO dto) {
        User actor = currentUser();
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint introuvable"));

        sprint.setNom(dto.getNom());
        sprint.setDescription(dto.getDescription());
        sprint.setDateDebut(dto.getDateDebut());
        sprint.setDateFin(dto.getDateFin());
        sprint.setCapacitePoints(dto.getCapacitePoints());
        
        Sprint saved = sprintRepository.save(sprint);
        activityLogger.log(actor, ActivityLog.Action.SPRINT_UPDATED, "Sprint mis a jour: " + saved.getNom(), saved.getProject(), saved, null);
        return toDto(saved);
    }

    @Transactional
    public void deleteSprint(Long id) {
        sprintRepository.deleteById(id);
    }

    @Transactional
    public SprintDTO startSprint(Long id) {
        User actor = currentUser();
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint introuvable"));
        sprint.setStatut(Sprint.Statut.ACTIF);
        Sprint saved = sprintRepository.save(sprint);
        activityLogger.log(actor, ActivityLog.Action.SPRINT_STARTED, "Sprint demarre: " + saved.getNom(), saved.getProject(), saved, null);
        return toDto(saved);
    }

    @Transactional
    public SprintDTO finishSprint(Long id) {
        User actor = currentUser();
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint introuvable"));
        sprint.setStatut(Sprint.Statut.FERME);
        Sprint saved = sprintRepository.save(sprint);
        activityLogger.log(actor, ActivityLog.Action.SPRINT_FINISHED, "Sprint termine: " + saved.getNom(), saved.getProject(), saved, null);
        return toDto(saved);
    }

    private SprintDTO toDto(Sprint sprint) {
        return SprintDTO.builder()
                .id(sprint.getId())
                .nom(sprint.getNom())
                .description(sprint.getDescription())
                .dateDebut(sprint.getDateDebut())
                .dateFin(sprint.getDateFin())
                .capacitePoints(sprint.getCapacitePoints())
                .pointsUtilises(sprint.getPointsUtilises())
                .statut(mapStatut(sprint.getStatut()))
                .projetId(sprint.getProject().getId())
                .build();
    }

    private String mapStatut(Sprint.Statut statut) {
        return switch (statut) {
            case PLANIFIE -> "PLANIFIE";
            case ACTIF -> "EN_COURS";
            case FERME -> "TERMINE";
        };
    }
}
