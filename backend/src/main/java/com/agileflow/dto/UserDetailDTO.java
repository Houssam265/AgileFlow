package com.agileflow.dto;

import java.util.List;

public record UserDetailDTO(
        Long id,
        String email,
        String firstName,
        String lastName,
        String role,
        String createdAt,
        Boolean active,
        String lastLogin,
        List<TeamMembershipDTO> teams
) {}
