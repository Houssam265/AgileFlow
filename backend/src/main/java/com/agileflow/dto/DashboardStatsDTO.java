package com.agileflow.dto;

public record DashboardStatsDTO(
        String role,
        long totalUsers,
        long activeUsers,
        long totalTeams,
        long managedTeams,
        long totalProjects,
        long managedProjects,
        long activeProjects,
        long activeSprints,
        long totalTasks,
        long todoTasks,
        long inProgressTasks,
        long doneTasks
) {}
