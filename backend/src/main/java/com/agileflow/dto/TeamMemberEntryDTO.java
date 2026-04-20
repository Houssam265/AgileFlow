package com.agileflow.dto;

public record TeamMemberEntryDTO(
        UserDTO user,
        String joinedAt
) {}
