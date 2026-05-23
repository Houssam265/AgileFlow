package com.agileflow.dto;

public record ProjectMemberDTO(
        Long userId,
        String email,
        String firstName,
        String lastName,
        String role,
        boolean owner,
        String joinedAt
) {}
