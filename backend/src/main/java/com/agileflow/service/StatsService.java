package com.agileflow.service;

import com.agileflow.dto.BurndownPointDTO;
import com.agileflow.dto.StatsDTO;
import com.agileflow.dto.VelocityPointDTO;
import com.agileflow.entity.Sprint;
import com.agileflow.entity.Task;
import com.agileflow.entity.User;
import com.agileflow.exception.BadRequestException;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.SprintRepository;
import com.agileflow.repository.TaskRepository;
import com.agileflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final TaskRepository taskRepository;
    private final SprintRepository sprintRepository;
    private final UserRepository userRepository;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur courant introuvable"));
    }

    @Transactional(readOnly = true)
    public StatsDTO getStats(Long projectId, Long sprintId) {
        User actor = currentUser();
        Scope scope = resolveScope(actor);
        DateRange range = resolveDateRange(sprintId);

        long totalTasks = count(projectId, sprintId, scope, null);
        long todoTasks = count(projectId, sprintId, scope, Task.Statut.TODO);
        long inProgressTasks = count(projectId, sprintId, scope, Task.Statut.IN_PROGRESS);
        long reviewTasks = count(projectId, sprintId, scope, Task.Statut.REVIEW);
        long completedTasks = count(projectId, sprintId, scope, Task.Statut.DONE);
        long activeSprints = countActiveSprints(projectId, scope);

        List<BurndownPointDTO> burndown = buildBurndown(projectId, sprintId, scope, range, totalTasks);
        List<VelocityPointDTO> velocity = buildVelocity(projectId, sprintId, scope);
        double completionRate = totalTasks == 0 ? 0 : round((completedTasks * 100.0) / totalTasks);
        double averageVelocity = velocity.stream()
                .mapToLong(VelocityPointDTO::completedStoryPoints)
                .average()
                .orElse(0);

        return new StatsDTO(
                projectId,
                sprintId,
                range.startDate().toString(),
                range.endDate().toString(),
                totalTasks,
                todoTasks,
                inProgressTasks,
                reviewTasks,
                completedTasks,
                completionRate,
                activeSprints,
                round(averageVelocity),
                burndown,
                velocity
        );
    }

    private long count(Long projectId, Long sprintId, Scope scope, Task.Statut statut) {
        return taskRepository.countForStats(projectId, sprintId, scope.managerId(), scope.actorId(), statut);
    }

    private long countActiveSprints(Long projectId, Scope scope) {
        if (scope.actorId() != null) {
            return 0;
        }
        if (projectId != null) {
            return sprintRepository.findByProjectId(projectId).stream()
                    .filter(sprint -> sprint.getStatut() == Sprint.Statut.ACTIF)
                    .filter(sprint -> scope.managerId() == null
                            || (sprint.getProject() != null
                            && sprint.getProject().getManager() != null
                            && sprint.getProject().getManager().getId().equals(scope.managerId())))
                    .count();
        }
        return scope.managerId() == null
                ? sprintRepository.countByStatut(Sprint.Statut.ACTIF)
                : sprintRepository.countByProject_Manager_IdAndStatut(scope.managerId(), Sprint.Statut.ACTIF);
    }

    private List<BurndownPointDTO> buildBurndown(Long projectId, Long sprintId, Scope scope, DateRange range, long totalTasks) {
        Map<LocalDate, Long> completedByDate = new HashMap<>();
        for (Object[] row : taskRepository.aggregateCompletedTasksByDueDate(
                range.startDate(), range.endDate(), projectId, sprintId, scope.managerId(), scope.actorId())) {
            completedByDate.put((LocalDate) row[0], number(row[1]));
        }

        long durationDays = Math.max(1, ChronoUnit.DAYS.between(range.startDate(), range.endDate()));
        long completedSoFar = 0;
        List<BurndownPointDTO> points = new ArrayList<>();
        LocalDate cursor = range.startDate();
        while (!cursor.isAfter(range.endDate())) {
            completedSoFar += completedByDate.getOrDefault(cursor, 0L);
            long elapsed = ChronoUnit.DAYS.between(range.startDate(), cursor);
            long ideal = Math.max(0, Math.round(totalTasks - ((totalTasks * 1.0) * elapsed / durationDays)));
            points.add(new BurndownPointDTO(cursor.toString(), Math.max(0, totalTasks - completedSoFar), ideal));
            cursor = cursor.plusDays(1);
        }
        return points;
    }

    private List<VelocityPointDTO> buildVelocity(Long projectId, Long sprintId, Scope scope) {
        return taskRepository.aggregateVelocityBySprint(projectId, sprintId, scope.managerId(), scope.actorId())
                .stream()
                .map(row -> new VelocityPointDTO(
                        (Long) row[0],
                        String.valueOf(row[1]),
                        number(row[2]),
                        number(row[3]),
                        number(row[4]),
                        number(row[5])
                ))
                .toList();
    }

    private DateRange resolveDateRange(Long sprintId) {
        if (sprintId == null) {
            LocalDate today = LocalDate.now();
            return new DateRange(today.minusDays(13), today);
        }
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint introuvable"));
        if (sprint.getDateDebut() == null || sprint.getDateFin() == null) {
            throw new BadRequestException("Le sprint doit avoir une date de debut et une date de fin.");
        }
        return new DateRange(sprint.getDateDebut(), sprint.getDateFin());
    }

    private Scope resolveScope(User actor) {
        return switch (actor.getRole()) {
            case ROLE_ADMIN -> new Scope(null, null);
            case ROLE_MANAGER -> new Scope(actor.getId(), null);
            case ROLE_DEVELOPER -> new Scope(null, actor.getId());
        };
    }

    private long number(Object value) {
        return value == null ? 0 : ((Number) value).longValue();
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private record Scope(Long managerId, Long actorId) {
    }

    private record DateRange(LocalDate startDate, LocalDate endDate) {
    }
}
