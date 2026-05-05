package com.agileflow.dto;

import java.time.LocalDateTime;

public record NotificationDTO(
        Long id,
        String message,
        boolean lu,
        LocalDateTime dateCreation
) {}
