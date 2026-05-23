package com.agileflow.dto;

public record AcceptProjectInvitationRequest(
        String token,
        Long invitationId
) {}
