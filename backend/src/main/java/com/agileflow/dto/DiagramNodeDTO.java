package com.agileflow.dto;

public record DiagramNodeDTO(
        String id,
        Long diagramId,
        String type,
        Double positionX,
        Double positionY,
        Double width,
        Double height,
        String data,
        Integer zIndex,
        Boolean locked
) {
}
