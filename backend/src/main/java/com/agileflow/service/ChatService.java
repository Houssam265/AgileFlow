package com.agileflow.service;

import com.agileflow.dto.ChatMessageDTO;
import com.agileflow.entity.ChatMessage;
import com.agileflow.entity.ChatPresence;
import com.agileflow.entity.Project;
import com.agileflow.entity.User;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.ChatMessageRepository;
import com.agileflow.repository.ChatPresenceRepository;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatPresenceRepository chatPresenceRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    @Transactional
    public ChatMessageDTO saveMessage(ChatMessageDTO dto) {
        User sender = userRepository.findById(dto.senderId())
                .orElseThrow(() -> new ResourceNotFoundException("Expéditeur introuvable"));

        ChatMessage.ChatMessageBuilder builder = ChatMessage.builder()
                .sender(sender)
                .channelType(dto.channelType())
                .content(dto.content())
                .createdAt(LocalDateTime.now());

        if (dto.channelType() == ChatMessage.ChannelType.PROJECT) {
            Project project = projectRepository.findById(dto.projectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"));
            builder.project(project);
        } else if (dto.channelType() == ChatMessage.ChannelType.PRIVATE) {
            User recipient = userRepository.findById(dto.recipientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Destinataire introuvable"));
            builder.recipient(recipient);
        }

        ChatMessage saved = chatMessageRepository.save(builder.build());
        return mapToDTO(saved);
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageDTO> getMessagesByChannel(ChatMessage.ChannelType type, Long projectId, Long recipientId, Long currentUserId, int page) {
        Pageable pageable = PageRequest.of(page, 50);
        Page<ChatMessage> messages;

        switch (type) {
            case PROJECT -> messages = chatMessageRepository.findProjectMessages(projectId, pageable);
            case PRIVATE -> messages = chatMessageRepository.findPrivateMessages(currentUserId, recipientId, pageable);
            default -> messages = chatMessageRepository.findGlobalMessages(pageable);
        }

        // Map to DTO and sort by createdAt ASC for UI display
        List<ChatMessageDTO> dtoList = new ArrayList<>(messages.getContent().stream()
                .map(this::mapToDTO)
                .toList());
        
        dtoList.sort(Comparator.comparing(ChatMessageDTO::createdAt));

        return new PageImpl<>(dtoList, pageable, messages.getTotalElements());
    }

    @Transactional
    public void updatePresence(Long userId, boolean isOnline) {
        chatPresenceRepository.upsertPresence(userId, isOnline, LocalDateTime.now());
    }

    public List<Long> getOnlineUsers() {
        return chatPresenceRepository.findOnlineUserIds();
    }

    private ChatMessageDTO mapToDTO(ChatMessage message) {
        return new ChatMessageDTO(
                message.getId(),
                message.getSender().getId(),
                message.getSender().getPrenom() + " " + message.getSender().getNom(),
                null, // Avatar can be added later if available in User entity
                message.getChannelType(),
                message.getProject() != null ? message.getProject().getId() : null,
                message.getRecipient() != null ? message.getRecipient().getId() : null,
                message.getContent(),
                message.getCreatedAt()
        );
    }
}
