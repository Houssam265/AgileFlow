package com.agileflow.dto;

import com.agileflow.entity.Diagram;

import java.util.List;

public record DiagramDTO(
        Long id,
        String titre,
        Diagram.Type type,
        List<String> etapes,
        String json,
        Long projectId,
        String projectName,
        Long ownerId,
        String ownerName,
        boolean shared,
        String createdAt,
        String updatedAt
) {
}
