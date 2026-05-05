package com.agileflow.dto;

public record AdminDashboardDTO(
        long totalUsers,
        long activeUsers,
        long totalProjects,
        long totalTasks,
        long totalTeams,
        long totalDiagrams,
        long totalNotifications
) {}
