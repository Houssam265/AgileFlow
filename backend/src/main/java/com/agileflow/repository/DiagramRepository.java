package com.agileflow.repository;

import com.agileflow.entity.Diagram;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DiagramRepository extends JpaRepository<Diagram, Long> {

    @EntityGraph(attributePaths = {"project", "project.manager", "owner", "createdBy", "task"})
    @Query("""
            SELECT d
            FROM Diagram d
            JOIN d.project p
            LEFT JOIN p.manager manager
            LEFT JOIN d.owner owner
            LEFT JOIN d.createdBy createdBy
            WHERE (:projectId IS NULL OR p.id = :projectId)
              AND (:actorId IS NULL
                   OR owner.id = :actorId
                   OR createdBy.id = :actorId
                   OR d.shared = true
                   OR d.isShared = true
                   OR manager.id = :actorId
                   OR EXISTS (
                        SELECT 1
                        FROM DiagramCollaborator c
                        WHERE c.diagram = d AND c.user.id = :actorId
                   ))
            ORDER BY d.updatedAt DESC, d.id DESC
            """)
    List<Diagram> findVisible(@Param("projectId") Long projectId, @Param("actorId") Long actorId);

    @EntityGraph(attributePaths = {"project", "project.manager", "owner", "createdBy", "task"})
    @Query("SELECT d FROM Diagram d WHERE d.id = :id")
    Optional<Diagram> findWithRelationsById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"project", "project.manager", "owner", "createdBy", "task"})
    List<Diagram> findByProjectId(Long projectId);

    @EntityGraph(attributePaths = {"project", "project.manager", "owner", "createdBy", "task"})
    List<Diagram> findByCreatedById(Long userId);

    @EntityGraph(attributePaths = {"project", "project.manager", "owner", "createdBy", "task"})
    List<Diagram> findBySharedTrue();

    @EntityGraph(attributePaths = {"project", "project.manager", "owner", "createdBy", "task"})
    List<Diagram> findByProjectIdAndType(Long projectId, Diagram.Type type);

    @EntityGraph(attributePaths = {"project", "project.manager", "owner", "createdBy", "task"})
    @Query("""
            SELECT DISTINCT d
            FROM Diagram d
            LEFT JOIN d.owner owner
            LEFT JOIN d.createdBy createdBy
            WHERE owner.id = :userId OR createdBy.id = :userId OR d.shared = true OR d.isShared = true
            ORDER BY d.updatedAt DESC, d.id DESC
            """)
    List<Diagram> findByCreatedByIdOrIsSharedTrue(@Param("userId") Long userId);

    @EntityGraph(attributePaths = {"project", "project.manager", "owner", "createdBy", "task"})
    List<Diagram> findByTaskId(Long taskId);
}
