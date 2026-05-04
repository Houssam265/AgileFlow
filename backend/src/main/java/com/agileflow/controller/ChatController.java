package com.agileflow.controller;

import com.agileflow.dto.ChatMessageDTO;
import com.agileflow.entity.ChatMessage;
import com.agileflow.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/send")
    public void handleSendMessage(@Payload ChatMessageDTO messageDTO) {
        try {
            ChatMessageDTO savedMessage = chatService.saveMessage(messageDTO);
            String destination;

            if (savedMessage.channelType() == ChatMessage.ChannelType.GLOBAL) {
                destination = "/topic/chat/global";
            } else if (savedMessage.channelType() == ChatMessage.ChannelType.PROJECT) {
                destination = "/topic/chat/project/" + savedMessage.projectId();
            } else {
                String recipientDest = "/topic/chat/private/" + savedMessage.recipientId();
                String senderDest = "/topic/chat/private/" + savedMessage.senderId();
                
                messagingTemplate.convertAndSend(recipientDest, savedMessage);
                messagingTemplate.convertAndSend(senderDest, savedMessage);
                return;
            }

            messagingTemplate.convertAndSend(destination, savedMessage);
        } catch (Exception e) {
            // Error logged by Spring or higher level
        }
    }

    @MessageMapping("/chat/presence")
    public void handlePresence(@Payload Map<String, Object> payload) {
        try {
            Long userId = Long.valueOf(payload.get("userId").toString());
            boolean isOnline = (boolean) payload.get("isOnline");

            chatService.updatePresence(userId, isOnline);
            List<Long> onlineUsers = chatService.getOnlineUsers();

            messagingTemplate.convertAndSend("/topic/chat/presence", onlineUsers);
        } catch (Exception e) {
            // Error logged by Spring or higher level
        }
    }
}
