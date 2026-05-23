package com.agileflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminAnnouncementRequest(
        @NotNull TargetType targetType,
        Long projectId,
        Long userId,
        @NotBlank @Size(max = 255) String message
) {
    public enum TargetType {
        ALL_USERS,
        PROJECT_MEMBERS,
        SPECIFIC_USER
    }
}
