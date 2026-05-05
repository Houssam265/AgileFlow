package com.agileflow.service;

import com.agileflow.dto.NotificationDTO;
import com.agileflow.entity.Notification;
import com.agileflow.entity.User;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final int PAGE_SIZE = 20;

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public Page<Notification> getNotificationsForUser(Long userId, int page) {
        int safePage = Math.max(page, 0);
        Pageable pageable = PageRequest.of(safePage, PAGE_SIZE);
        return notificationRepository.findByUser_IdOrderByDateCreationDesc(userId, pageable);
    }

    @Transactional
    public Notification markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .filter(n -> n.getUser() != null && n.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Notification introuvable"));
        notification.setLu(true);
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> notifications = notificationRepository.findByUser_IdOrderByDateCreationDesc(userId);
        notifications.forEach(notification -> notification.setLu(true));
        notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .filter(n -> n.getUser() != null && n.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Notification introuvable"));
        notificationRepository.delete(notification);
    }

    @Transactional
    public Notification createAndBroadcast(User user, String message) {
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .lu(false)
                .dateCreation(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        messagingTemplate.convertAndSend("/topic/notifications/" + user.getId(), toDto(saved));
        return saved;
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
