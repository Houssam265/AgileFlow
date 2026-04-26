package com.agileflow.dto;

import java.util.List;

public record StatsDTO(
        Long projectId,
        Long sprintId,
        String startDate,
        String endDate,
        long totalTasks,
        long todoTasks,
        long inProgressTasks,
        long reviewTasks,
        long completedTasks,
        double completionRate,
        long activeSprints,
        double averageVelocity,
        List<BurndownPointDTO> burndown,
        List<VelocityPointDTO> velocity
) {
}
