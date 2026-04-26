package com.agileflow.dto;

import com.agileflow.entity.Task;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record UpdateTaskRequest(
        @NotBlank(message = "Le titre de la tache est obligatoire.")
        @Size(max = 200, message = "Le titre ne doit pas depasser 200 caracteres.")
        String titre,

        @Size(max = 5000, message = "La description ne doit pas depasser 5000 caracteres.")
        String description,

        Task.Priorite priorite,

        Long assignedToId,

        String dateEcheance,

        Set<String> labels
) {
}
