package com.agileflow.repository;

import com.agileflow.entity.UserStory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserStoryRepository extends JpaRepository<UserStory, Long> {
    @Query("""
            SELECT us FROM UserStory us
            JOIN FETCH us.backlog b
            JOIN FETCH b.project p
            LEFT JOIN FETCH us.sprint s
            WHERE p.id = :projectId
              AND (:priority IS NULL OR us.priority = :priority)
            ORDER BY
              CASE us.priority
                WHEN com.agileflow.entity.UserStory.Priority.CRITICAL THEN 1
                WHEN com.agileflow.entity.UserStory.Priority.HIGH THEN 2
                WHEN com.agileflow.entity.UserStory.Priority.MEDIUM THEN 3
                ELSE 4
              END,
              us.createdAt DESC,
              us.id DESC
            """)
    List<UserStory> findByProjectIdAndPriority(@Param("projectId") Long projectId, @Param("priority") UserStory.Priority priority);
}
