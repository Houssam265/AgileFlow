package com.agileflow.repository;

import com.agileflow.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    @Query("""
            SELECT DISTINCT p FROM Project p
            JOIN FETCH p.manager
            WHERE :q IS NULL
               OR LOWER(p.nom) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(COALESCE(p.description, '')) LIKE LOWER(CONCAT('%', :q, '%'))
            ORDER BY p.dateDebut DESC, p.id DESC
            """)
    List<Project> search(@Param("q") String q);

    List<Project> findByManagerId(Long managerId);

    long countByManager_Id(Long managerId);

    long countByStatut(Project.Statut statut);

    long countByManager_IdAndStatut(Long managerId, Project.Statut statut);
}
