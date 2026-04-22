package com.agileflow.repository;

import com.agileflow.entity.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SprintRepository extends JpaRepository<Sprint, Long> {
    List<Sprint> findByProjectId(Long projectId);

    long countByStatut(Sprint.Statut statut);

    long countByProject_Manager_IdAndStatut(Long managerId, Sprint.Statut statut);
}
