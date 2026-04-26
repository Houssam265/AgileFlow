package com.agileflow.dto;

import jakarta.validation.constraints.NotNull;

public record AssignTaskRequest(
        @NotNull(message = "L'identifiant de l'utilisateur est obligatoire.")
        Long assignedToId
) {
}
