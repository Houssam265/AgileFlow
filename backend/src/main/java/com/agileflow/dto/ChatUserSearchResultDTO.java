package com.agileflow.dto;

public record ChatUserSearchResultDTO(
        Long userId,
        String email,
        String firstName,
        String lastName,
        String role,
        String relationshipStatus
) {}
