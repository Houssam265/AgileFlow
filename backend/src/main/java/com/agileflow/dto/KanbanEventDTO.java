package com.agileflow.dto;

public record KanbanEventDTO(
        String eventType,
        Long taskId,
        TaskDTO updatedTask,
        Long projectId
) {}