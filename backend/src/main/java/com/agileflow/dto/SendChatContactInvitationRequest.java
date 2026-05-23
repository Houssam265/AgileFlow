package com.agileflow.dto;

import jakarta.validation.constraints.NotNull;

public record SendChatContactInvitationRequest(
        @NotNull(message = "Le destinataire est obligatoire")
        Long recipientId
) {}
