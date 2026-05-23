package com.agileflow.controller;

import com.agileflow.dto.ChatMessageDTO;
import com.agileflow.entity.ChatPresence;
import com.agileflow.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/send")
    public void handleSendMessage(@Payload ChatMessageDTO messageDTO) {
        try {
            chatService.saveMessage(messageDTO);
        } catch (Exception ignored) {
            // ignore
        }
    }

    @MessageMapping("/chat/presence")
    public void handlePresence(@Payload Map<String, Object> payload) {
        try {
            Long userId = Long.valueOf(payload.get("userId").toString());
            boolean connected = payload.get("isOnline") == null || Boolean.parseBoolean(payload.get("isOnline").toString());
            ChatPresence.VisibilityStatus status = parseStatus(payload.get("status"), connected);

            chatService.updatePresence(userId, connected, status);
            chatService.broadcastPresenceSnapshot(messagingTemplate);
        } catch (Exception ignored) {
            // ignore
        }
    }

    private ChatPresence.VisibilityStatus parseStatus(Object rawStatus, boolean connected) {
        if (!connected) {
            return ChatPresence.VisibilityStatus.ABSENT;
        }
        if (rawStatus == null) {
            return ChatPresence.VisibilityStatus.LIVE;
        }
        try {
            return ChatPresence.VisibilityStatus.valueOf(rawStatus.toString().trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return ChatPresence.VisibilityStatus.LIVE;
        }
    }
}
