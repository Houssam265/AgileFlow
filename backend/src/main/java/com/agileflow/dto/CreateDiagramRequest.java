package com.agileflow.dto;

import com.agileflow.entity.Diagram;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateDiagramRequest(
        @NotBlank(message = "Le titre du diagramme est obligatoire.")
        @Size(max = 150, message = "Le titre ne doit pas depasser 150 caracteres.")
        String titre,

        @NotNull(message = "Le type du diagramme est obligatoire.")
        Diagram.Type type,

        @NotNull(message = "Le projet est obligatoire.")
        Long projectId,

        Long taskId,

        @NotNull(message = "Les etapes sont obligatoires.")
        @Size(min = 1, max = 40, message = "Le diagramme doit contenir entre 1 et 40 etapes.")
        List<@NotBlank(message = "Une etape ne peut pas etre vide.") @Size(max = 200, message = "Une etape ne doit pas depasser 200 caracteres.") String> etapes,

        @Size(max = 30000, message = "Le JSON du diagramme ne doit pas depasser 30000 caracteres.")
        String json,

        boolean shared
) {
}
