package com.agileflow.dto;

import com.agileflow.entity.Task;
import jakarta.validation.constraints.NotNull;

public record MoveTaskRequest(
        @NotNull(message = "Le statut cible est obligatoire.")
        Task.Statut statut
) {
}
