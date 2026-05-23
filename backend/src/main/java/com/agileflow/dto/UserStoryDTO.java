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
        Long epicId,
        String epicTitle,
        String epicColor,
        long taskCount,
        long completedTaskCount,
        boolean done,
        String createdAt
) {
}
