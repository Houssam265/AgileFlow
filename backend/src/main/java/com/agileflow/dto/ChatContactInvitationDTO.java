package com.agileflow.dto;

import com.agileflow.entity.ChatContactInvitation;

import java.time.LocalDateTime;

public record ChatContactInvitationDTO(
        Long id,
        Long requesterId,
        String requesterFirstName,
        String requesterLastName,
        String requesterEmail,
        Long recipientId,
        String recipientFirstName,
        String recipientLastName,
        String recipientEmail,
        ChatContactInvitation.InvitationStatus status,
        LocalDateTime createdAt,
        LocalDateTime respondedAt
) {}
