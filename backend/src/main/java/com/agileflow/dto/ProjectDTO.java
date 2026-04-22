package com.agileflow.dto;

public record ProjectDTO(
        Long id,
        String name,
        String description,
        String startDate,
        String endDate,
        String status,
        Long managerId,
        String managerName,
        Long sprintCount,
        Long taskCount
) {}
