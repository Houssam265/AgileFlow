package com.agileflow.repository;

import com.agileflow.entity.DiagramCollaborator;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DiagramCollaboratorRepository extends JpaRepository<DiagramCollaborator, Long> {
    Optional<DiagramCollaborator> findByDiagramIdAndUserId(Long diagramId, Long userId);

    List<DiagramCollaborator> findByDiagramId(Long diagramId);

    List<DiagramCollaborator> findByUserId(Long userId);

    boolean existsByDiagramIdAndUserId(Long diagramId, Long userId);

    long countByDiagramId(Long diagramId);

    void deleteByDiagramIdAndUserId(Long diagramId, Long userId);
}
