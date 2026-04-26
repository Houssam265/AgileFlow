package com.agileflow.repository;

import com.agileflow.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    @Query("""
            SELECT COUNT(log.id)
            FROM ActivityLog log
            WHERE log.activityDate BETWEEN :startDate AND :endDate
              AND (:sprintId IS NULL OR log.sprint.id = :sprintId)
              AND (:managerId IS NULL OR log.project.manager.id = :managerId)
              AND (:actorId IS NULL OR log.actor.id = :actorId)
            """)
    long countForScope(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("sprintId") Long sprintId,
            @Param("managerId") Long managerId,
            @Param("actorId") Long actorId
    );

    @Query("""
            SELECT COUNT(DISTINCT log.actor.id)
            FROM ActivityLog log
            WHERE log.activityDate BETWEEN :startDate AND :endDate
              AND (:sprintId IS NULL OR log.sprint.id = :sprintId)
              AND (:managerId IS NULL OR log.project.manager.id = :managerId)
              AND (:actorId IS NULL OR log.actor.id = :actorId)
            """)
    long countActiveMembersForScope(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("sprintId") Long sprintId,
            @Param("managerId") Long managerId,
            @Param("actorId") Long actorId
    );

    @Query("""
            SELECT actor.id,
                   CONCAT(CONCAT(COALESCE(actor.prenom, ''), ' '), COALESCE(actor.nom, '')),
                   actor.email,
                   actor.role,
                   COUNT(log.id),
                   SUM(CASE WHEN log.action = com.agileflow.entity.ActivityLog.Action.TASK_COMPLETED THEN 1 ELSE 0 END)
            FROM ActivityLog log
            JOIN log.actor actor
            WHERE log.activityDate BETWEEN :startDate AND :endDate
              AND (:sprintId IS NULL OR log.sprint.id = :sprintId)
              AND (:managerId IS NULL OR log.project.manager.id = :managerId)
              AND (:actorId IS NULL OR actor.id = :actorId)
            GROUP BY actor.id, actor.prenom, actor.nom, actor.email, actor.role
            ORDER BY COUNT(log.id) DESC, actor.id ASC
            """)
    List<Object[]> aggregateByMember(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("sprintId") Long sprintId,
            @Param("managerId") Long managerId,
            @Param("actorId") Long actorId
    );

    @Query("""
            SELECT log.activityDate, COUNT(log.id)
            FROM ActivityLog log
            WHERE log.activityDate BETWEEN :startDate AND :endDate
              AND (:sprintId IS NULL OR log.sprint.id = :sprintId)
              AND (:managerId IS NULL OR log.project.manager.id = :managerId)
              AND (:actorId IS NULL OR log.actor.id = :actorId)
            GROUP BY log.activityDate
            ORDER BY log.activityDate ASC
            """)
    List<Object[]> aggregateByDate(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("sprintId") Long sprintId,
            @Param("managerId") Long managerId,
            @Param("actorId") Long actorId
    );

    @Query("""
            SELECT log.activityDate,
                   COUNT(log.id),
                   SUM(CASE WHEN log.action = com.agileflow.entity.ActivityLog.Action.TASK_COMPLETED THEN 1 ELSE 0 END)
            FROM ActivityLog log
            WHERE log.activityDate BETWEEN :startDate AND :endDate
              AND (:sprintId IS NULL OR log.sprint.id = :sprintId)
              AND (:managerId IS NULL OR log.project.manager.id = :managerId)
              AND (:actorId IS NULL OR log.actor.id = :actorId)
            GROUP BY log.activityDate
            ORDER BY log.activityDate ASC
            """)
    List<Object[]> aggregateTrendByDate(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("sprintId") Long sprintId,
            @Param("managerId") Long managerId,
            @Param("actorId") Long actorId
    );
}
