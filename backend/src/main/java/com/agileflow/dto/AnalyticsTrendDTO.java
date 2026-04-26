package com.agileflow.dto;

public record AnalyticsTrendDTO(
        String date,
        long activityCount,
        long completedTasks
) {
}
