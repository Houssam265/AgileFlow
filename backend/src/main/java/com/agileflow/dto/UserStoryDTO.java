package com.agileflow.dto;

public record UserStoryDTO(
        Long id,
        String title,
        String description,
        String priority,
        Integer storyPoints,
        String acceptanceCriteria,
        Long backlogId,
        Long projectId,
        Long sprintId,
        String sprintLabel,
        String createdAt
) {
}
