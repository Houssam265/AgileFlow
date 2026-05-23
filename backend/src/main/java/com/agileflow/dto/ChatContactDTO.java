package com.agileflow.dto;

public record ChatContactDTO(
        Long userId,
        String email,
        String firstName,
        String lastName,
        String role,
        Long invitationId
) {}
