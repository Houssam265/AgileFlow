package com.agileflow.dto;

import com.agileflow.entity.Project;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateProjectRequest(
        @NotBlank String name,
        String description,
        @NotNull LocalDate startDate,
        LocalDate endDate,
        @NotNull Project.Statut status,
        Long managerId,
        Long teamId
) {}
