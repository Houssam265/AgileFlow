package com.agileflow.service;

import com.agileflow.entity.Comment;
import com.agileflow.entity.Task;
import com.agileflow.entity.User;
import com.agileflow.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class MentionNotificationService {

    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final EmailNotificationService emailNotificationService;

    public void notifyMentionedUsers(Comment comment, Set<User> recipients) {
        if (comment == null || recipients == null || recipients.isEmpty()) {
            return;
        }

        Task task = comment.getTask();
        String taskTitle = task != null ? task.getTitre() : "tache";
        String authorName = (comment.getAuteur().getPrenom() + " " + comment.getAuteur().getNom()).trim();
        String message = authorName + " vous a mentionne dans la tache \"" + taskTitle + "\"";
        LocalDateTime now = LocalDateTime.now();

        Set<User> uniqueRecipients = new LinkedHashSet<>(recipients);
        uniqueRecipients.forEach(user -> notificationService.createAndBroadcast(user, message));

        uniqueRecipients.forEach(user -> {
            messagingTemplate.convertAndSendToUser(
                    user.getEmail(),
                    "/queue/mentions",
                    Map.of(
                            "type", "MENTION",
                            "message", message,
                            "taskId", task != null ? task.getId() : null,
                            "commentId", comment.getId(),
                            "createdAt", now.toString()
                    )
            );

            if (task != null) {
                emailNotificationService.sendMention(user, task, authorName);
            }
        });
    }
}
