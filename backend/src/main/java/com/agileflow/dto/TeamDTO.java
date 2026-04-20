package com.agileflow.dto;

public record TeamDTO(
        Long id,
        String name,
        String description,
        Long managerId,
        String managerName,
        long memberCount,
        String createdAt
) {}
