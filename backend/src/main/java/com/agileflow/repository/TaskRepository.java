package com.agileflow.repository;

import com.agileflow.entity.Task;
import com.agileflow.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByAssignedToId(Long userId);
    List<Task> findBySprintId(Long sprintId);

    long countByStatut(Task.Statut statut);

    long countByAssignedTo_Id(Long userId);

    long countByAssignedTo_IdAndStatut(Long userId, Task.Statut statut);

    long countBySprint_Project_Manager_Id(Long managerId);

    long countBySprint_Project_Manager_IdAndStatut(Long managerId, Task.Statut statut);

    List<Task> findBySprint_Project_Id(Long projectId);

    List<Task> findByStory_Id(Long storyId);

    @Query("""
            SELECT DISTINCT t
            FROM Task t
            LEFT JOIN FETCH t.assignedTo assigned
            LEFT JOIN FETCH t.sprint s
            LEFT JOIN FETCH s.project p
            LEFT JOIN FETCH t.story story
            LEFT JOIN FETCH story.backlog backlog
            LEFT JOIN FETCH backlog.project backlogProject
            WHERE t.dateEcheance IS NOT NULL
              AND t.isUrgent = false
              AND t.statut <> com.agileflow.entity.Task.Statut.DONE
              AND t.dateEcheance BETWEEN :windowStart AND :windowEnd
            """)
    List<Task> findTasksBecomingUrgent(
            @Param("windowStart") LocalDateTime windowStart,
            @Param("windowEnd") LocalDateTime windowEnd
    );

    @Query("""
            SELECT DISTINCT t
            FROM Task t
            LEFT JOIN FETCH t.assignedTo assigned
            LEFT JOIN FETCH t.sprint s
            LEFT JOIN FETCH s.project p
            LEFT JOIN FETCH t.story story
            LEFT JOIN FETCH story.backlog backlog
            LEFT JOIN FETCH backlog.project backlogProject
            WHERE t.dateEcheance IS NOT NULL
              AND t.deadline24hReminderSent = false
              AND t.statut <> com.agileflow.entity.Task.Statut.DONE
              AND assigned IS NOT NULL
              AND t.dateEcheance >= :now
              AND t.dateEcheance <= :deadlineThreshold
            """)
    List<Task> findTasksFor24hReminder(
            @Param("now") LocalDateTime now,
            @Param("deadlineThreshold") LocalDateTime deadlineThreshold
    );

    @Query("""
            SELECT DISTINCT t
            FROM Task t
            LEFT JOIN FETCH t.assignedTo assigned
            LEFT JOIN FETCH t.sprint s
            LEFT JOIN FETCH s.project p
            LEFT JOIN FETCH t.story story
            LEFT JOIN FETCH story.backlog backlog
            LEFT JOIN FETCH backlog.project backlogProject
            WHERE t.dateEcheance IS NOT NULL
              AND t.deadline1hReminderSent = false
              AND t.statut <> com.agileflow.entity.Task.Statut.DONE
              AND assigned IS NOT NULL
              AND t.dateEcheance >= :now
              AND t.dateEcheance <= :deadlineThreshold
            """)
    List<Task> findTasksFor1hReminder(
            @Param("now") LocalDateTime now,
            @Param("deadlineThreshold") LocalDateTime deadlineThreshold
    );

    @Query("""
            SELECT DISTINCT assigned
            FROM Task t
            JOIN t.sprint s
            JOIN s.project p
            JOIN t.assignedTo assigned
            WHERE p.id = :projectId
            """)
    List<User> findDistinctAssigneesByProjectId(@Param("projectId") Long projectId);

    @Query("""
            SELECT COUNT(t.id)
            FROM Task t
            LEFT JOIN t.sprint s
            LEFT JOIN s.project p
            WHERE (:projectId IS NULL OR p.id = :projectId)
              AND (:sprintId IS NULL OR s.id = :sprintId)
              AND (:managerId IS NULL OR p.manager.id = :managerId)
              AND (:actorId IS NULL OR t.assignedTo.id = :actorId)
              AND (:statut IS NULL OR t.statut = :statut)
            """)
    long countForStats(
            @Param("projectId") Long projectId,
            @Param("sprintId") Long sprintId,
            @Param("managerId") Long managerId,
            @Param("actorId") Long actorId,
            @Param("statut") Task.Statut statut
    );

    @Query("""
            SELECT FUNCTION('DATE', t.dateEcheance), COUNT(t.id)
            FROM Task t
            LEFT JOIN t.sprint s
            LEFT JOIN s.project p
            WHERE t.statut = com.agileflow.entity.Task.Statut.DONE
              AND t.dateEcheance IS NOT NULL
              AND t.dateEcheance >= :startDateAtStart
              AND t.dateEcheance < :endDateExclusive
              AND (:projectId IS NULL OR p.id = :projectId)
              AND (:sprintId IS NULL OR s.id = :sprintId)
              AND (:managerId IS NULL OR p.manager.id = :managerId)
              AND (:actorId IS NULL OR t.assignedTo.id = :actorId)
            GROUP BY FUNCTION('DATE', t.dateEcheance)
            ORDER BY FUNCTION('DATE', t.dateEcheance) ASC
            """)
    List<Object[]> aggregateCompletedTasksByDueDate(
            @Param("startDateAtStart") LocalDateTime startDateAtStart,
            @Param("endDateExclusive") LocalDateTime endDateExclusive,
            @Param("projectId") Long projectId,
            @Param("sprintId") Long sprintId,
            @Param("managerId") Long managerId,
            @Param("actorId") Long actorId
    );

    @Query("""
            SELECT s.id,
                   s.nom,
                   COUNT(t.id),
                   SUM(CASE WHEN t.statut = com.agileflow.entity.Task.Statut.DONE THEN 1 ELSE 0 END),
                   SUM(CASE WHEN t.statut = com.agileflow.entity.Task.Statut.DONE THEN COALESCE(story.storyPoints, 0) ELSE 0 END),
                   COALESCE(s.capacitePoints, 0)
            FROM Task t
            JOIN t.sprint s
            LEFT JOIN t.story story
            LEFT JOIN s.project p
            WHERE (:projectId IS NULL OR p.id = :projectId)
              AND (:sprintId IS NULL OR s.id = :sprintId)
              AND (:managerId IS NULL OR p.manager.id = :managerId)
              AND (:actorId IS NULL OR t.assignedTo.id = :actorId)
            GROUP BY s.id, s.nom, s.capacitePoints
            ORDER BY s.dateDebut ASC, s.id ASC
            """)
    List<Object[]> aggregateVelocityBySprint(
            @Param("projectId") Long projectId,
            @Param("sprintId") Long sprintId,
            @Param("managerId") Long managerId,
            @Param("actorId") Long actorId
    );
}
