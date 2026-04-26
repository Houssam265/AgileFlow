package com.agileflow.dto;

import java.util.List;

public record AnalyticsDTO(
        String period,
        String startDate,
        String endDate,
        Long sprintId,
        long totalActivities,
        long completedTasks,
        long activeMembers,
        List<AnalyticsMemberStatsDTO> memberStats,
        List<ActivityHeatmapDTO> heatmap,
        List<AnalyticsTrendDTO> trend
) {
}
