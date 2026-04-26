package com.agileflow.repository;

import com.agileflow.entity.Diagram;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DiagramRepository extends JpaRepository<Diagram, Long> {

    @EntityGraph(attributePaths = {"project", "project.manager", "owner"})
    @Query("""
            SELECT d
            FROM Diagram d
            JOIN d.project p
            LEFT JOIN p.manager manager
            JOIN d.owner owner
            WHERE (:projectId IS NULL OR p.id = :projectId)
              AND (:actorId IS NULL OR owner.id = :actorId OR d.shared = true OR manager.id = :actorId)
            ORDER BY d.updatedAt DESC, d.id DESC
            """)
    List<Diagram> findVisible(@Param("projectId") Long projectId, @Param("actorId") Long actorId);

    @EntityGraph(attributePaths = {"project", "project.manager", "owner"})
    @Query("SELECT d FROM Diagram d WHERE d.id = :id")
    Optional<Diagram> findWithRelationsById(@Param("id") Long id);
}
