package com.agileflow.dto;

import java.util.Set;

public record TaskDTO(
        Long id,
        String titre,
        String description,
        String statut,
        String priorite,
        boolean isUrgent,
        Long assignedToId,
        String assignedToName,
        Long sprintId,
        String sprintLabel,
        Long storyId,
        String dateEcheance,
        Set<String> labels
) {
}
