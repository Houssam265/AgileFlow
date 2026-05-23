package com.agileflow.dto;

public record InviteProjectMemberRequest(
        Long userId,
        String email
) {}
