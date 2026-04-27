package com.agileflow.service;

import com.agileflow.entity.Sprint;
import com.agileflow.entity.Task;
import com.agileflow.entity.TeamMember;
import com.agileflow.entity.User;
import com.agileflow.repository.TeamMemberRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationService {

    private final JavaMailSender mailSender;
    private final EmailPreferencesService emailPreferencesService;
    private final EmailTemplateService emailTemplateService;
    private final TeamMemberRepository teamMemberRepository;

    public void sendTaskAssigned(Task task) {
        User assignee = task.getAssignedTo();
        if (assignee == null) {
            return;
        }
        EmailTemplateService.RenderedEmail email = emailTemplateService.buildTaskAssigned(assignee, task);
        sendToUserIfEnabled(assignee, EmailNotificationType.TASK_ASSIGNED, email);
    }

    public void sendSprintStarted(Sprint sprint) {
        Map<Long, User> recipients = new LinkedHashMap<>();
        if (sprint.getProject() != null && sprint.getProject().getManager() != null) {
            User manager = sprint.getProject().getManager();
            recipients.put(manager.getId(), manager);
            List<TeamMember> members = teamMemberRepository.findByTeam_Manager_Id(manager.getId());
            for (TeamMember member : members) {
                recipients.put(member.getUser().getId(), member.getUser());
            }
        }

        recipients.values().forEach(user -> {
            EmailTemplateService.RenderedEmail email = emailTemplateService.buildSprintStarted(user, sprint);
            sendToUserIfEnabled(user, EmailNotificationType.SPRINT_START, email);
        });
    }

    private void sendToUserIfEnabled(User user, EmailNotificationType type, EmailTemplateService.RenderedEmail email) {
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            return;
        }
        if (!emailPreferencesService.isEnabled(user, type)) {
            return;
        }
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setTo(user.getEmail());
            helper.setSubject(email.subject());
            helper.setText(email.html(), true);
            mailSender.send(mimeMessage);
        } catch (Exception ex) {
            log.warn("Email {} non envoye a {}: {}", type, user.getEmail(), ex.getMessage());
        }
    }
}
