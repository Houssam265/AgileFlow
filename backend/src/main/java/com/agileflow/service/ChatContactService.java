package com.agileflow.service;

import com.agileflow.dto.*;
import com.agileflow.entity.ChatContactInvitation;
import com.agileflow.entity.User;
import com.agileflow.exception.BadRequestException;
import com.agileflow.exception.ConflictException;
import com.agileflow.exception.ForbiddenOperationException;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.ChatContactInvitationRepository;
import com.agileflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatContactService {

    private final ChatContactInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<ChatContactDTO> listContacts(Long currentUserId) {
        return invitationRepository.findAcceptedContacts(currentUserId).stream()
                .map(inv -> toContactDto(inv, currentUserId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatContactInvitationDTO> listPendingReceived(Long currentUserId) {
        return invitationRepository.findPendingReceived(currentUserId).stream()
                .map(this::toInvitationDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatContactInvitationDTO> listPendingSent(Long currentUserId) {
        return invitationRepository.findPendingSent(currentUserId).stream()
                .map(this::toInvitationDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatUserSearchResultDTO> searchUsers(Long currentUserId, String query) {
        if (query == null || query.trim().length() < 2) {
            throw new BadRequestException("Saisissez au moins 2 caractères pour rechercher un utilisateur");
        }
        String q = query.trim();
        List<User> users = userRepository.search(q);
        List<ChatUserSearchResultDTO> results = new ArrayList<>();
        for (User user : users) {
            if (!user.isActif() || user.getId().equals(currentUserId)) {
                continue;
            }
            results.add(new ChatUserSearchResultDTO(
                    user.getId(),
                    user.getEmail(),
                    user.getPrenom(),
                    user.getNom(),
                    user.getRole().name(),
                    resolveRelationshipStatus(currentUserId, user.getId())
            ));
        }
        return results;
    }

    @Transactional
    public ChatContactInvitationDTO sendInvitation(Long currentUserId, Long recipientId) {
        if (currentUserId.equals(recipientId)) {
            throw new BadRequestException("Vous ne pouvez pas vous inviter vous-même");
        }
        User requester = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur courant introuvable"));
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        if (!recipient.isActif()) {
            throw new BadRequestException("Cet utilisateur n'est pas disponible");
        }

        if (invitationRepository.areContacts(currentUserId, recipientId)) {
            throw new ConflictException("Vous êtes déjà en contact avec cet utilisateur");
        }

        Optional<ChatContactInvitation> reverse = invitationRepository
                .findByRequester_IdAndRecipient_Id(recipientId, currentUserId);
        if (reverse.isPresent()) {
            ChatContactInvitation existing = reverse.get();
            if (existing.getStatus() == ChatContactInvitation.InvitationStatus.PENDING) {
                return acceptInvitation(currentUserId, existing.getId());
            }
            if (existing.getStatus() == ChatContactInvitation.InvitationStatus.ACCEPTED) {
                throw new ConflictException("Vous êtes déjà en contact avec cet utilisateur");
            }
        }

        Optional<ChatContactInvitation> direct = invitationRepository
                .findByRequester_IdAndRecipient_Id(currentUserId, recipientId);
        if (direct.isPresent()) {
            ChatContactInvitation existing = direct.get();
            if (existing.getStatus() == ChatContactInvitation.InvitationStatus.PENDING) {
                throw new ConflictException("Une invitation est déjà en attente pour cet utilisateur");
            }
            if (existing.getStatus() == ChatContactInvitation.InvitationStatus.ACCEPTED) {
                throw new ConflictException("Vous êtes déjà en contact avec cet utilisateur");
            }
            existing.setStatus(ChatContactInvitation.InvitationStatus.PENDING);
            existing.setCreatedAt(LocalDateTime.now());
            existing.setRespondedAt(null);
            ChatContactInvitation saved = invitationRepository.save(existing);
            notifyInvitationReceived(recipient, requester);
            return toInvitationDto(saved);
        }

        ChatContactInvitation invitation = ChatContactInvitation.builder()
                .requester(requester)
                .recipient(recipient)
                .status(ChatContactInvitation.InvitationStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
        ChatContactInvitation saved = invitationRepository.save(invitation);
        notifyInvitationReceived(recipient, requester);
        return toInvitationDto(saved);
    }

    @Transactional
    public ChatContactInvitationDTO acceptInvitation(Long currentUserId, Long invitationId) {
        ChatContactInvitation invitation = getInvitationForRecipient(currentUserId, invitationId);
        if (invitation.getStatus() != ChatContactInvitation.InvitationStatus.PENDING) {
            throw new BadRequestException("Cette invitation n'est plus en attente");
        }
        invitation.setStatus(ChatContactInvitation.InvitationStatus.ACCEPTED);
        invitation.setRespondedAt(LocalDateTime.now());
        ChatContactInvitation saved = invitationRepository.save(invitation);

        String acceptorName = invitation.getRecipient().getPrenom() + " " + invitation.getRecipient().getNom();
        notificationService.createAndBroadcast(
                invitation.getRequester(),
                acceptorName + " a accepté votre demande de contact pour le chat"
        );
        return toInvitationDto(saved);
    }

    @Transactional
    public ChatContactInvitationDTO rejectInvitation(Long currentUserId, Long invitationId) {
        ChatContactInvitation invitation = getInvitationForRecipient(currentUserId, invitationId);
        if (invitation.getStatus() != ChatContactInvitation.InvitationStatus.PENDING) {
            throw new BadRequestException("Cette invitation n'est plus en attente");
        }
        invitation.setStatus(ChatContactInvitation.InvitationStatus.REJECTED);
        invitation.setRespondedAt(LocalDateTime.now());
        return toInvitationDto(invitationRepository.save(invitation));
    }

    @Transactional(readOnly = true)
    public void assertCanSendPrivateMessage(Long senderId, Long recipientId) {
        if (senderId.equals(recipientId)) {
            throw new BadRequestException("Impossible d'envoyer un message privé à vous-même");
        }
        if (!invitationRepository.areContacts(senderId, recipientId)) {
            throw new ForbiddenOperationException(
                    "Vous devez être en contact avec cet utilisateur pour lui envoyer un message privé"
            );
        }
    }

    private ChatContactInvitation getInvitationForRecipient(Long currentUserId, Long invitationId) {
        ChatContactInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation introuvable"));
        if (!invitation.getRecipient().getId().equals(currentUserId)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas répondre à cette invitation");
        }
        return invitation;
    }

    private String resolveRelationshipStatus(Long currentUserId, Long otherUserId) {
        List<ChatContactInvitation> active = invitationRepository.findActiveBetween(currentUserId, otherUserId);
        if (active.isEmpty()) {
            return "NONE";
        }
        for (ChatContactInvitation inv : active) {
            if (inv.getStatus() == ChatContactInvitation.InvitationStatus.ACCEPTED) {
                return "CONTACT";
            }
            if (inv.getStatus() == ChatContactInvitation.InvitationStatus.PENDING) {
                if (inv.getRequester().getId().equals(currentUserId)) {
                    return "PENDING_SENT";
                }
                return "PENDING_RECEIVED";
            }
        }
        return "NONE";
    }

    private void notifyInvitationReceived(User recipient, User requester) {
        String requesterName = requester.getPrenom() + " " + requester.getNom();
        notificationService.createAndBroadcast(
                recipient,
                requesterName + " souhaite vous ajouter comme contact pour le chat"
        );
    }

    private ChatContactDTO toContactDto(ChatContactInvitation invitation, Long currentUserId) {
        User other = invitation.getRequester().getId().equals(currentUserId)
                ? invitation.getRecipient()
                : invitation.getRequester();
        return new ChatContactDTO(
                other.getId(),
                other.getEmail(),
                other.getPrenom(),
                other.getNom(),
                other.getRole().name(),
                invitation.getId()
        );
    }

    private ChatContactInvitationDTO toInvitationDto(ChatContactInvitation invitation) {
        User requester = invitation.getRequester();
        User recipient = invitation.getRecipient();
        return new ChatContactInvitationDTO(
                invitation.getId(),
                requester.getId(),
                requester.getPrenom(),
                requester.getNom(),
                requester.getEmail(),
                recipient.getId(),
                recipient.getPrenom(),
                recipient.getNom(),
                recipient.getEmail(),
                invitation.getStatus(),
                invitation.getCreatedAt(),
                invitation.getRespondedAt()
        );
    }
}
