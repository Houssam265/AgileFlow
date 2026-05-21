package com.agileflow.dto;

import com.agileflow.entity.Diagram;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateDiagramRequest(
        @Size(max = 150, message = "Le titre ne doit pas depasser 150 caracteres.")
        String titre,

        @Size(max = 150, message = "Le titre ne doit pas depasser 150 caracteres.")
        String title,

        @Size(max = 2000, message = "La description ne doit pas depasser 2000 caracteres.")
        String description,

        @NotNull(message = "Le type du diagramme est obligatoire.")
        Diagram.Type type,

        @Size(max = 80, message = "Le diagramme doit contenir au maximum 80 etapes.")
        List<@NotBlank(message = "Une etape ne peut pas etre vide.") @Size(max = 200, message = "Une etape ne doit pas depasser 200 caracteres.") String> etapes,

        @Size(max = 500000, message = "Le JSON du diagramme ne doit pas depasser 500000 caracteres.")
        String json,

        @Size(max = 500000, message = "Le JSON du canvas ne doit pas depasser 500000 caracteres.")
        String canvasData,

        @Size(max = 500000, message = "Le contenu du diagramme ne doit pas depasser 500000 caracteres.")
        String content,

        @Size(max = 1000, message = "L'URL de miniature ne doit pas depasser 1000 caracteres.")
        String thumbnailUrl,

        boolean shared,

        Boolean isShared,

        Long taskId,

        List<DiagramNodeDTO> nodes,

        List<DiagramEdgeDTO> edges
) {
    public UpdateDiagramRequest(
            String titre,
            Diagram.Type type,
            List<String> etapes,
            String json,
            boolean shared
    ) {
        this(titre, null, null, type, etapes, json, null, null, null, shared, shared, null, List.of(), List.of());
    }

    public String effectiveTitle() {
        if (title != null && !title.isBlank()) {
            return title.trim();
        }
        return titre != null ? titre.trim() : "";
    }

    public boolean effectiveShared() {
        return isShared != null ? isShared : shared;
    }

    public String effectiveCanvasData() {
        if (content != null && !content.isBlank()) {
            return content;
        }
        return canvasData != null && !canvasData.isBlank() ? canvasData : json;
    }
}
