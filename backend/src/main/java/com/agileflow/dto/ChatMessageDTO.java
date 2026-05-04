package com.agileflow.dto;

import com.agileflow.entity.ChatMessage;
import java.time.LocalDateTime;

public record ChatMessageDTO(
    Long id,
    Long senderId,
    String senderName,
    String senderAvatar,
    ChatMessage.ChannelType channelType,
    Long projectId,
    Long recipientId,
    String content,
    LocalDateTime createdAt
) {}
