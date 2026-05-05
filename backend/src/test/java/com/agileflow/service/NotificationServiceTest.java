package com.agileflow.service;

import com.agileflow.dto.NotificationDTO;
import com.agileflow.entity.Notification;
import com.agileflow.entity.User;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private NotificationService notificationService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(7L)
                .email("dev@agileflow.dev")
                .prenom("Alice")
                .nom("Dev")
                .role(User.Role.ROLE_DEVELOPER)
                .actif(true)
                .build();
    }

    @Test
    void getNotificationsForUser_clampsNegativePage() {
        Notification n = Notification.builder().id(1L).message("m").lu(false).dateCreation(LocalDateTime.now()).user(user).build();
        when(notificationRepository.findByUser_IdOrderByDateCreationDesc(eq(7L), any(Pageable.class)))
                .thenAnswer(inv -> {
                    Pageable p = inv.getArgument(1);
                    assertThat(p.getPageNumber()).isZero();
                    return new PageImpl<>(List.of(n), p, 1);
                });

        Page<Notification> page = notificationService.getNotificationsForUser(7L, -3);

        assertThat(page.getContent()).hasSize(1);
    }

    @Test
    void markAsRead_updatesAndSaves() {
        Notification n = Notification.builder().id(10L).message("x").lu(false).dateCreation(LocalDateTime.now()).user(user).build();
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(n));
        when(notificationRepository.save(n)).thenReturn(n);

        Notification updated = notificationService.markAsRead(10L, 7L);

        assertThat(updated.isLu()).isTrue();
        verify(notificationRepository).save(n);
    }

    @Test
    void markAsRead_wrongUser_throws() {
        Notification n = Notification.builder().id(10L).message("x").lu(false).dateCreation(LocalDateTime.now()).user(user).build();
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(n));

        assertThatThrownBy(() -> notificationService.markAsRead(10L, 999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void markAllAsRead_marksEveryRow() {
        Notification a = Notification.builder().id(1L).message("a").lu(false).dateCreation(LocalDateTime.now()).user(user).build();
        Notification b = Notification.builder().id(2L).message("b").lu(false).dateCreation(LocalDateTime.now()).user(user).build();
        when(notificationRepository.findByUser_IdOrderByDateCreationDesc(7L)).thenReturn(List.of(a, b));

        notificationService.markAllAsRead(7L);

        assertThat(a.isLu()).isTrue();
        assertThat(b.isLu()).isTrue();
        verify(notificationRepository).saveAll(List.of(a, b));
    }

    @Test
    void deleteNotification_removesRow() {
        Notification n = Notification.builder().id(5L).message("z").lu(false).dateCreation(LocalDateTime.now()).user(user).build();
        when(notificationRepository.findById(5L)).thenReturn(Optional.of(n));

        notificationService.deleteNotification(5L, 7L);

        verify(notificationRepository).delete(n);
    }

    @Test
    void createAndBroadcast_persistsAndSendsWebSocketPayload() {
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
            Notification saved = inv.getArgument(0);
            saved.setId(42L);
            return saved;
        });

        Notification created = notificationService.createAndBroadcast(user, "Nouvelle alerte");

        assertThat(created.getId()).isEqualTo(42L);
        assertThat(created.getMessage()).isEqualTo("Nouvelle alerte");
        assertThat(created.isLu()).isFalse();

        ArgumentCaptor<NotificationDTO> dtoCaptor = ArgumentCaptor.forClass(NotificationDTO.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/notifications/7"), dtoCaptor.capture());
        NotificationDTO sent = dtoCaptor.getValue();
        assertThat(sent.id()).isEqualTo(42L);
        assertThat(sent.message()).isEqualTo("Nouvelle alerte");
        assertThat(sent.lu()).isFalse();
    }
}
