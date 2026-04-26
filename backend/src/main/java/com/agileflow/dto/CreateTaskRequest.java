package com.agileflow.dto;

import com.agileflow.entity.Task;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record CreateTaskRequest(
        @NotBlank(message = "Le titre de la tache est obligatoire.")
        @Size(max = 200, message = "Le titre ne doit pas depasser 200 caracteres.")
        String titre,

        @Size(max = 5000, message = "La description ne doit pas depasser 5000 caracteres.")
        String description,

        @NotNull(message = "La priorite est obligatoire.")
        Task.Priorite priorite,

        Long sprintId,

        Long assignedToId,

        Long storyId,

        String dateEcheance,

        Set<String> labels
) {
}
