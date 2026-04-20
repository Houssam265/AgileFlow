package com.agileflow.dto;

import java.util.List;

public record TeamWithMembersDTO(
        Long id,
        String name,
        String description,
        String createdAt,
        UserDTO manager,
        List<TeamMemberEntryDTO> members
) {}
