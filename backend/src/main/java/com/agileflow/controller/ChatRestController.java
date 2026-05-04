package com.agileflow.controller;

import com.agileflow.dto.ChatMessageDTO;
import com.agileflow.entity.ChatMessage;
import com.agileflow.entity.User;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.UserRepository;
import com.agileflow.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatRestController {

    private final ChatService chatService;
    private final UserRepository userRepository;

    @GetMapping("/messages")
    @PreAuthorize("isAuthenticated()")
    public Page<ChatMessageDTO> getMessages(
            @RequestParam String channelType,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long recipientId,
            @RequestParam(defaultValue = "0") int page) {
        
        ChatMessage.ChannelType type;
        try {
            type = ChatMessage.ChannelType.valueOf(channelType.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid channel type: " + channelType);
        }

        User currentUser = getCurrentUser();
        return chatService.getMessagesByChannel(type, projectId, recipientId, currentUser.getId(), page);
    }

    @GetMapping("/presence")
    @PreAuthorize("isAuthenticated()")
    public List<Long> getOnlineUsers() {
        return chatService.getOnlineUsers();
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur courant introuvable"));
    }
}
