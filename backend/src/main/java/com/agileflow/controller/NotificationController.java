package com.agileflow.controller;

import com.agileflow.dto.NotificationDTO;
import com.agileflow.entity.Notification;
import com.agileflow.entity.User;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.UserRepository;
import com.agileflow.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public Page<NotificationDTO> getNotifications(@RequestParam(defaultValue = "0") int page) {
        User currentUser = getCurrentUser();
        return notificationService.getNotificationsForUser(currentUser.getId(), page)
                .map(this::toDto);
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public NotificationDTO markAsRead(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        Notification notification = notificationService.markAsRead(id, currentUser.getId());
        return toDto(notification);
    }

    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public void markAllAsRead() {
        User currentUser = getCurrentUser();
        notificationService.markAllAsRead(currentUser.getId());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public void deleteNotification(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        notificationService.deleteNotification(id, currentUser.getId());
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur courant introuvable"));
    }

    private NotificationDTO toDto(Notification notification) {
        return new NotificationDTO(
                notification.getId(),
                notification.getMessage(),
                notification.isLu(),
                notification.getDateCreation()
        );
    }
}
