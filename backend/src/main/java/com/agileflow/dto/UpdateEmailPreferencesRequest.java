package com.agileflow.dto;

public record UpdateEmailPreferencesRequest(
        Boolean sprintStartEnabled,
        Boolean taskAssignedEnabled,
        Boolean deadlineEnabled,
        Boolean mentionEnabled
) {
}
