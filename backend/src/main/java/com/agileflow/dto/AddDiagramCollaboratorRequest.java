package com.agileflow.dto;

import com.agileflow.entity.DiagramCollaborator;
import jakarta.validation.constraints.NotNull;

public record AddDiagramCollaboratorRequest(
        @NotNull Long userId,
        DiagramCollaborator.Permission permission,
        String role
) {
    public DiagramCollaborator.Permission effectivePermission() {
        if (permission != null) {
            return permission;
        }
        if (role == null || role.isBlank()) {
            return DiagramCollaborator.Permission.VIEW;
        }
        String normalizedRole = role.trim().toUpperCase();
        if ("EDITOR".equals(normalizedRole)) {
            return DiagramCollaborator.Permission.EDIT;
        }
        if ("VIEWER".equals(normalizedRole)) {
            return DiagramCollaborator.Permission.VIEW;
        }
        try {
            return DiagramCollaborator.Permission.valueOf(normalizedRole);
        } catch (IllegalArgumentException ignored) {
            return DiagramCollaborator.Permission.VIEW;
        }
    }
}
