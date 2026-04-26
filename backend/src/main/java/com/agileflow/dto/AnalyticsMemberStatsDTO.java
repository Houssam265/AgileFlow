package com.agileflow.dto;

public record AnalyticsMemberStatsDTO(
        Long userId,
        String memberName,
        String role,
        long activityCount,
        long completedTasks
) {
}
