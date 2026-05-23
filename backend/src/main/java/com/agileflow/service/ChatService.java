package com.agileflow.service;

import com.agileflow.dto.ChatMessageDTO;
import com.agileflow.dto.ChatPresenceDTO;
import com.agileflow.entity.ChatPresence;
import com.agileflow.entity.ChatMessage;
import com.agileflow.entity.Project;
import com.agileflow.entity.User;
import com.agileflow.exception.BadRequestException;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.ChatMessageRepository;
import com.agileflow.repository.ChatPresenceRepository;
import com.agileflow.repository.ProjectMemberRepository;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatPresenceRepository chatPresenceRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ChatContactService chatContactService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatMessageDTO saveMessage(ChatMessageDTO dto) {
        if (dto.channelType() == ChatMessage.ChannelType.GLOBAL) {
            throw new BadRequestException("Le canal de chat global n'est plus disponible.");
        }

        User sender = userRepository.findById(dto.senderId())
                .orElseThrow(() -> new ResourceNotFoundException("Expéditeur introuvable"));

        if (dto.channelType() == ChatMessage.ChannelType.PRIVATE) {
            if (dto.recipientId() == null) {
                throw new BadRequestException("Destinataire requis pour un message privé");
            }
            chatContactService.assertCanSendPrivateMessage(sender.getId(), dto.recipientId());
        }

        if (dto.channelType() == ChatMessage.ChannelType.PROJECT && dto.projectId() == null) {
            throw new BadRequestException("Projet requis pour un message de projet");
        }

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
        ChatMessageDTO savedDto = mapToDTO(saved);
        broadcastMessage(savedDto);
        notifyInboxRecipients(savedDto, sender.getId());
        return savedDto;
    }

    public void broadcastMessage(ChatMessageDTO savedMessage) {
        if (savedMessage.channelType() == ChatMessage.ChannelType.PROJECT) {
            messagingTemplate.convertAndSend("/topic/chat/project/" + savedMessage.projectId(), savedMessage);
        } else if (savedMessage.channelType() == ChatMessage.ChannelType.PRIVATE) {
            messagingTemplate.convertAndSend("/topic/chat/private/" + savedMessage.recipientId(), savedMessage);
            messagingTemplate.convertAndSend("/topic/chat/private/" + savedMessage.senderId(), savedMessage);
        }
    }

    public void notifyInboxRecipients(ChatMessageDTO message, Long senderId) {
        for (Long userId : resolveInboxRecipientIds(message, senderId)) {
            messagingTemplate.convertAndSend("/topic/chat/inbox/" + userId, message);
        }
    }

    private Set<Long> resolveInboxRecipientIds(ChatMessageDTO message, Long senderId) {
        Set<Long> recipientIds = new HashSet<>();
        if (message.channelType() == ChatMessage.ChannelType.PRIVATE) {
            if (message.recipientId() != null && !message.recipientId().equals(senderId)) {
                recipientIds.add(message.recipientId());
            }
            return recipientIds;
        }

        if (message.channelType() == ChatMessage.ChannelType.PROJECT && message.projectId() != null) {
            Project project = projectRepository.findById(message.projectId())
                    .orElse(null);
            if (project == null) {
                return recipientIds;
            }
            if (project.getManager() != null && !project.getManager().getId().equals(senderId)) {
                recipientIds.add(project.getManager().getId());
            }
            projectMemberRepository.findByProject_IdOrderByJoinedAtAsc(message.projectId()).stream()
                    .map(pm -> pm.getUser().getId())
                    .filter(id -> !id.equals(senderId))
                    .forEach(recipientIds::add);
        }
        return recipientIds;
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageDTO> getMessagesByChannel(ChatMessage.ChannelType type, Long projectId, Long recipientId, Long currentUserId, int page) {
        if (type == ChatMessage.ChannelType.GLOBAL) {
            throw new BadRequestException("Le canal de chat global n'est plus disponible.");
        }

        Pageable pageable = PageRequest.of(page, 50);
        Page<ChatMessage> messages = switch (type) {
            case PROJECT -> chatMessageRepository.findProjectMessages(projectId, pageable);
            case PRIVATE -> chatMessageRepository.findPrivateMessages(currentUserId, recipientId, pageable);
            default -> throw new BadRequestException("Type de canal non supporte.");
        };

        List<ChatMessageDTO> dtoList = new ArrayList<>(messages.getContent().stream()
                .map(this::mapToDTO)
                .toList());

        dtoList.sort(Comparator.comparing(ChatMessageDTO::createdAt));

        return new PageImpl<>(dtoList, pageable, messages.getTotalElements());
    }

    @Transactional
    public void updatePresence(Long userId, boolean connected, ChatPresence.VisibilityStatus status) {
        ChatPresence.VisibilityStatus effectiveStatus = connected ? status : ChatPresence.VisibilityStatus.ABSENT;
        chatPresenceRepository.upsertPresence(
                userId,
                connected,
                LocalDateTime.now(),
                effectiveStatus.name()
        );
    }

    @Transactional(readOnly = true)
    public List<ChatPresenceDTO> getPresenceSnapshot() {
        return chatPresenceRepository.findAll().stream()
                .map(p -> new ChatPresenceDTO(p.getUserId(), p.getStatus(), p.isOnline()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ChatPresenceDTO getPresenceForUser(Long userId) {
        return chatPresenceRepository.findById(userId)
                .map(p -> new ChatPresenceDTO(p.getUserId(), p.getStatus(), p.isOnline()))
                .orElse(new ChatPresenceDTO(userId, ChatPresence.VisibilityStatus.ABSENT, false));
    }

    /** Utilisateurs en ligne avec statut LIVE (indicateur vert dans le chat). */
    public List<Long> getOnlineUsers() {
        return chatPresenceRepository.findLiveUserIds();
    }

    public void broadcastPresenceSnapshot(SimpMessagingTemplate messagingTemplate) {
        messagingTemplate.convertAndSend("/topic/chat/presence", getPresenceSnapshot());
    }

    private ChatMessageDTO mapToDTO(ChatMessage message) {
        return new ChatMessageDTO(
                message.getId(),
                message.getSender().getId(),
                message.getSender().getPrenom() + " " + message.getSender().getNom(),
                null,
                message.getChannelType(),
                message.getProject() != null ? message.getProject().getId() : null,
                message.getRecipient() != null ? message.getRecipient().getId() : null,
                message.getContent(),
                message.getCreatedAt()
        );
    }
}
