package com.agileflow.dto;

public record VelocityPointDTO(
        Long sprintId,
        String sprintName,
        long totalTasks,
        long completedTasks,
        long completedStoryPoints,
        long capacityPoints
) {
}
