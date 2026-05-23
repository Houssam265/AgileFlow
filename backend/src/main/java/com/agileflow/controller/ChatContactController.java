package com.agileflow.controller;

import com.agileflow.dto.*;
import com.agileflow.entity.User;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.UserRepository;
import com.agileflow.service.ChatContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat/contacts")
@RequiredArgsConstructor
public class ChatContactController {

    private final ChatContactService chatContactService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<ChatContactDTO> listContacts() {
        return chatContactService.listContacts(getCurrentUserId());
    }

    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public List<ChatUserSearchResultDTO> searchUsers(@RequestParam String q) {
        return chatContactService.searchUsers(getCurrentUserId(), q);
    }

    @GetMapping("/invitations/received")
    @PreAuthorize("isAuthenticated()")
    public List<ChatContactInvitationDTO> listPendingReceived() {
        return chatContactService.listPendingReceived(getCurrentUserId());
    }

    @GetMapping("/invitations/sent")
    @PreAuthorize("isAuthenticated()")
    public List<ChatContactInvitationDTO> listPendingSent() {
        return chatContactService.listPendingSent(getCurrentUserId());
    }

    @PostMapping("/invitations")
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatContactInvitationDTO sendInvitation(@Valid @RequestBody SendChatContactInvitationRequest request) {
        return chatContactService.sendInvitation(getCurrentUserId(), request.recipientId());
    }

    @PostMapping("/invitations/{id}/accept")
    @PreAuthorize("isAuthenticated()")
    public ChatContactInvitationDTO acceptInvitation(@PathVariable Long id) {
        return chatContactService.acceptInvitation(getCurrentUserId(), id);
    }

    @PostMapping("/invitations/{id}/reject")
    @PreAuthorize("isAuthenticated()")
    public ChatContactInvitationDTO rejectInvitation(@PathVariable Long id) {
        return chatContactService.rejectInvitation(getCurrentUserId(), id);
    }

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur courant introuvable"));
        return user.getId();
    }
}
