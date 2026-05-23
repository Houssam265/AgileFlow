package com.agileflow.dto;

import com.agileflow.entity.Epic;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateEpicRequest(
        @NotBlank @Size(max = 160) String title,
        @Size(max = 5000) String description,
        Epic.EpicStatus status,
        @Size(max = 7) String color,
        Integer sortOrder,
        LocalDate startDate,
        LocalDate endDate
) {}
