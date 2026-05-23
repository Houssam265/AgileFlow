package com.agileflow.repository;

import com.agileflow.entity.Epic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EpicRepository extends JpaRepository<Epic, Long> {

    @Query("""
            SELECT e FROM Epic e
            WHERE e.project.id = :projectId
            ORDER BY e.sortOrder ASC, e.createdAt ASC, e.id ASC
            """)
    List<Epic> findByProjectIdOrderBySortOrder(@Param("projectId") Long projectId);
}
