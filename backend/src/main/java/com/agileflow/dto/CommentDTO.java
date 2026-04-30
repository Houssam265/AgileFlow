package com.agileflow.dto;

import java.util.List;

public record CommentDTO(
        Long id,
        String contenu,
        UserDTO auteur,
        Long taskId,
        List<String> mentions,
        String createdAt
) {}
