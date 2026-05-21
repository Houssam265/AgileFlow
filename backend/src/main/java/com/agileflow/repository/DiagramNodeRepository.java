package com.agileflow.repository;

import com.agileflow.entity.DiagramNode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiagramNodeRepository extends JpaRepository<DiagramNode, String> {
    void deleteAllByDiagramId(Long diagramId);

    List<DiagramNode> findAllByDiagramId(Long diagramId);
}
