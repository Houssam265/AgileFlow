package com.agileflow.dto;

import com.agileflow.entity.ChatPresence;

public record ChatPresenceDTO(
        Long userId,
        ChatPresence.VisibilityStatus status,
        boolean connected
) {}
