package com.agileflow.controller;

import com.agileflow.dto.EmailPreferencesDTO;
import com.agileflow.dto.EmailPreviewDTO;
import com.agileflow.dto.UpdateEmailPreferencesRequest;
import com.agileflow.entity.User;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.UserRepository;
import com.agileflow.service.EmailNotificationType;
import com.agileflow.service.EmailPreferencesService;
import com.agileflow.service.EmailTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/email-preferences")
@RequiredArgsConstructor
public class EmailPreferencesController {

    private final EmailPreferencesService emailPreferencesService;
    private final EmailTemplateService emailTemplateService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public EmailPreferencesDTO getCurrentUserPreferences() {
        return emailPreferencesService.getCurrentUserPreferences();
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public EmailPreferencesDTO updateCurrentUserPreferences(@RequestBody UpdateEmailPreferencesRequest request) {
        return emailPreferencesService.updateCurrentUserPreferences(request);
    }

    @GetMapping("/me/preview")
    @PreAuthorize("isAuthenticated()")
    public EmailPreviewDTO preview(@RequestParam EmailNotificationType type) {
        User user = currentUser();
        EmailTemplateService.RenderedEmail preview = emailTemplateService.buildPreview(user, type);
        return new EmailPreviewDTO(type.name(), preview.subject(), preview.html());
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur courant introuvable"));
    }
}
