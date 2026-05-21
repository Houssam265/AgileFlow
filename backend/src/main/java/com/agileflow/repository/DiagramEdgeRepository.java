package com.agileflow.repository;

import com.agileflow.entity.DiagramEdge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiagramEdgeRepository extends JpaRepository<DiagramEdge, String> {
    void deleteAllByDiagramId(Long diagramId);

    List<DiagramEdge> findAllByDiagramId(Long diagramId);
}
