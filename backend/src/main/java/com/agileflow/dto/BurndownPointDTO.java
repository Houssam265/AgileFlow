package com.agileflow.dto;

public record BurndownPointDTO(
        String date,
        long remainingTasks,
        long idealRemainingTasks
) {
}
