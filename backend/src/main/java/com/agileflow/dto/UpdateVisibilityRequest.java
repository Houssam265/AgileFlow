package com.agileflow.dto;

import com.agileflow.entity.ChatPresence;

public record UpdateVisibilityRequest(
        ChatPresence.VisibilityStatus status
) {}
