package com.agileflow.dto;

public record DiagramEdgeDTO(
        String id,
        Long diagramId,
        String sourceNodeId,
        String targetNodeId,
        String sourceHandle,
        String targetHandle,
        String edgeType,
        String arrowStart,
        String arrowEnd,
        String data
) {
}
