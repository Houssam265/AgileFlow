package com.agileflow.repository;

import com.agileflow.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TeamRepository extends JpaRepository<Team, Long> {

    @Query("""
            SELECT DISTINCT t FROM Team t
            JOIN FETCH t.manager
            WHERE :q IS NULL
               OR LOWER(t.name) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(COALESCE(t.description,'')) LIKE LOWER(CONCAT('%', :q, '%'))
            ORDER BY t.createdAt DESC
            """)
    List<Team> search(@Param("q") String q);

    long countByManager_Id(Long managerId);
}
