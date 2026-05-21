package com.agileflow.dto;

import com.agileflow.entity.Diagram;

import java.util.List;

public record DiagramDTO(
        Long id,
        String title,
        String description,
        String titre,
        Diagram.Type type,
        List<String> etapes,
        String json,
        String canvasData,
        String content,
        Long projectId,
        String projectName,
        Long createdById,
        String createdByName,
        Long ownerId,
        String ownerName,
        Long taskId,
        String taskTitle,
        Boolean isShared,
        boolean shared,
        String thumbnailUrl,
        String createdAt,
        String updatedAt,
        List<DiagramNodeDTO> nodes,
        List<DiagramEdgeDTO> edges,
        int collaboratorsCount
) {
}
