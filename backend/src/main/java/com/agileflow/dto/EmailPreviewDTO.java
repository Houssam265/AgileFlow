package com.agileflow.dto;

public record EmailPreviewDTO(
        String type,
        String subject,
        String html
) {
}
