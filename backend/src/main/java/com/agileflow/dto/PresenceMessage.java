package com.agileflow.dto;

import java.time.LocalDateTime;

public record PresenceMessage(
        String type,
        Long diagramId,
        Long userId,
        String userName,
        String userColor,
        LocalDateTime timestamp
) {
}
