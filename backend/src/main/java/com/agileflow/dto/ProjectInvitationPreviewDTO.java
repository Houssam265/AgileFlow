package com.agileflow.dto;

public record ProjectInvitationPreviewDTO(
        String projectName,
        String ownerName,
        String invitedEmail,
        boolean expired,
        boolean alreadyAccepted
) {}
