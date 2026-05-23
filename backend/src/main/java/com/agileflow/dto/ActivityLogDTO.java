package com.agileflow.dto;

import com.agileflow.entity.ActivityLog;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ActivityLogDTO(
        Long id,
        Long actorId,
        String actorName,
        String actorEmail,
        String actorRole,
        ActivityLog.Action action,
        String message,
        Long projectId,
        String projectName,
        Long sprintId,
        String sprintName,
        Long taskId,
        String taskTitle,
        LocalDate activityDate,
        LocalDateTime createdAt
) {
}
