package com.agileflow.dto;

public record InviteProjectMemberResultDTO(
        String mode,
        String message,
        ProjectMemberDTO member
) {}
