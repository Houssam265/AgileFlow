package com.agileflow.websocket;

import com.agileflow.entity.User;
import com.agileflow.repository.UserRepository;
import com.agileflow.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.agileflow.entity.ChatPresence;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final ChatService chatService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String email = (String) headerAccessor.getSessionAttributes().get("email");

        if (email != null) {
            userRepository.findByEmail(email).ifPresent(user -> {
                log.info("User disconnected: {}", email);
                chatService.updatePresence(user.getId(), false, ChatPresence.VisibilityStatus.ABSENT);
                chatService.broadcastPresenceSnapshot(messagingTemplate);
            });
        }
    }
}
