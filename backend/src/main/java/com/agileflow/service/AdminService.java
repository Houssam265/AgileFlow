package com.agileflow.service;

import com.agileflow.dto.AdminAnnouncementRequest;
import com.agileflow.dto.ActivityLogDTO;
import com.agileflow.dto.AdminDashboardDTO;
import com.agileflow.entity.ActivityLog;
import com.agileflow.entity.Project;
import com.agileflow.entity.User;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.ActivityLogRepository;
import com.agileflow.repository.DiagramRepository;
import com.agileflow.repository.NotificationRepository;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.TaskRepository;
import com.agileflow.repository.TeamMemberRepository;
import com.agileflow.repository.TeamRepository;
import com.agileflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TeamRepository teamRepository;
    private final DiagramRepository diagramRepository;
    private final NotificationRepository notificationRepository;
    private final ActivityLogRepository activityLogRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public AdminDashboardDTO getDashboard() {
        return new AdminDashboardDTO(
                userRepository.count(),
                userRepository.countByActifTrue(),
                projectRepository.count(),
                taskRepository.count(),
                teamRepository.count(),
                diagramRepository.count(),
                notificationRepository.count()
        );
    }

    @Transactional(readOnly = true)
    public Page<ActivityLogDTO> getActivityLogs(
            int page,
            int size,
            String q,
            Long projectId,
            Long actorId,
            ActivityLog.Action action,
            LocalDate startDate,
            LocalDate endDate
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 5), 100);
        String query = q == null || q.isBlank() ? null : q.trim();
        return activityLogRepository.searchLogs(
                        query,
                        projectId,
                        actorId,
                        action,
                        startDate,
                        endDate,
                        PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"))
                )
                .map(this::toActivityLogDto);
    }

    @Transactional
    public int sendAnnouncement(AdminAnnouncementRequest request) {
        List<User> recipients = resolveAnnouncementRecipients(request);
        recipients.forEach(user -> notificationService.createAndBroadcast(user, request.message()));
        return recipients.size();
    }

    private List<User> resolveAnnouncementRecipients(AdminAnnouncementRequest request) {
        return switch (request.targetType()) {
            case ALL_USERS -> userRepository.findByActifTrueOrderByDateCreationDesc();
            case SPECIFIC_USER -> {
                if (request.userId() == null) {
                    throw new IllegalArgumentException("Utilisateur cible requis");
                }
                yield List.of(userRepository.findById(request.userId())
                        .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable")));
            }
            case PROJECT_MEMBERS -> {
                if (request.projectId() == null) {
                    throw new IllegalArgumentException("Projet cible requis");
                }
                Project project = projectRepository.findById(request.projectId())
                        .orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"));
                Map<Long, User> users = new LinkedHashMap<>();
                if (project.getManager() != null) {
                    users.put(project.getManager().getId(), project.getManager());
                }
                if (project.getTeam() != null) {
                    teamMemberRepository.findByTeam_IdOrderByJoinedAtAsc(project.getTeam().getId())
                            .forEach(member -> users.put(member.getUser().getId(), member.getUser()));
                }
                yield users.values().stream().filter(User::isActif).toList();
            }
        };
    }

    private ActivityLogDTO toActivityLogDto(ActivityLog log) {
        User actor = log.getActor();
        String actorName = fullName(actor);
        return new ActivityLogDTO(
                log.getId(),
                actor.getId(),
                actorName.isBlank() ? actor.getEmail() : actorName,
                actor.getEmail(),
                actor.getRole() != null ? actor.getRole().name() : null,
                log.getAction(),
                log.getMessage(),
                log.getProject() != null ? log.getProject().getId() : null,
                log.getProject() != null ? log.getProject().getNom() : null,
                log.getSprint() != null ? log.getSprint().getId() : null,
                log.getSprint() != null ? log.getSprint().getNom() : null,
                log.getTask() != null ? log.getTask().getId() : null,
                log.getTask() != null ? log.getTask().getTitre() : null,
                log.getActivityDate(),
                log.getCreatedAt()
        );
    }

    private String fullName(User user) {
        String firstName = user.getPrenom() != null ? user.getPrenom() : "";
        String lastName = user.getNom() != null ? user.getNom() : "";
        return (firstName + " " + lastName).trim();
    }
}
