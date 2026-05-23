package com.agileflow.dto;

import com.agileflow.entity.Epic;

public record EpicDTO(
        Long id,
        Long projectId,
        String title,
        String description,
        Epic.EpicStatus status,
        String color,
        Integer sortOrder,
        String startDate,
        String endDate,
        long storyCount,
        long plannedStoryCount,
        long doneStoryCount,
        long completedStoryCount,
        long totalTaskCount,
        long completedTaskCount,
        int totalStoryPoints,
        int progressPercent
) {}
