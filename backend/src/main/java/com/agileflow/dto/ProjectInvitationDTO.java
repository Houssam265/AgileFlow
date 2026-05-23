package com.agileflow.dto;

import com.agileflow.entity.ProjectInvitation;

import java.time.LocalDateTime;

public record ProjectInvitationDTO(
        Long id,
        Long projectId,
        String projectName,
        Long inviterId,
        String inviterFirstName,
        String inviterLastName,
        String invitedEmail,
        Long invitedUserId,
        ProjectInvitation.InvitationStatus status,
        LocalDateTime createdAt,
        LocalDateTime expiresAt,
        String token
) {}
