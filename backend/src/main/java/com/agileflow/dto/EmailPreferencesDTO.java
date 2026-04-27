package com.agileflow.dto;

public record EmailPreferencesDTO(
        Long userId,
        Boolean sprintStartEnabled,
        Boolean taskAssignedEnabled,
        Boolean deadlineEnabled,
        Boolean mentionEnabled
) {
}
