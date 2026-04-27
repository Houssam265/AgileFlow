package com.agileflow.service;

import com.agileflow.dto.EmailPreferencesDTO;
import com.agileflow.dto.UpdateEmailPreferencesRequest;
import com.agileflow.entity.User;
import com.agileflow.entity.UserEmailPreferences;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.UserEmailPreferencesRepository;
import com.agileflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EmailPreferencesService {

    private final UserRepository userRepository;
    private final UserEmailPreferencesRepository userEmailPreferencesRepository;

    @Transactional
    public EmailPreferencesDTO getCurrentUserPreferences() {
        User user = currentUser();
        return toDto(getOrCreate(user));
    }

    @Transactional
    public EmailPreferencesDTO updateCurrentUserPreferences(UpdateEmailPreferencesRequest request) {
        UserEmailPreferences preferences = getOrCreate(currentUser());
        if (request.sprintStartEnabled() != null) {
            preferences.setSprintStartEnabled(request.sprintStartEnabled());
        }
        if (request.taskAssignedEnabled() != null) {
            preferences.setTaskAssignedEnabled(request.taskAssignedEnabled());
        }
        if (request.deadlineEnabled() != null) {
            preferences.setDeadlineEnabled(request.deadlineEnabled());
        }
        if (request.mentionEnabled() != null) {
            preferences.setMentionEnabled(request.mentionEnabled());
        }
        return toDto(userEmailPreferencesRepository.save(preferences));
    }

    @Transactional
    public boolean isEnabled(User user, EmailNotificationType type) {
        UserEmailPreferences preferences = getOrCreate(user);
        return switch (type) {
            case SPRINT_START -> preferences.isSprintStartEnabled();
            case TASK_ASSIGNED -> preferences.isTaskAssignedEnabled();
            case DEADLINE -> preferences.isDeadlineEnabled();
            case MENTION -> preferences.isMentionEnabled();
        };
    }

    @Transactional
    public UserEmailPreferences getOrCreate(User user) {
        return userEmailPreferencesRepository.findByUser_Id(user.getId())
                .orElseGet(() -> userEmailPreferencesRepository.save(
                        UserEmailPreferences.builder().user(user).build()
                ));
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur courant introuvable"));
    }

    private EmailPreferencesDTO toDto(UserEmailPreferences preferences) {
        return new EmailPreferencesDTO(
                preferences.getUser().getId(),
                preferences.isSprintStartEnabled(),
                preferences.isTaskAssignedEnabled(),
                preferences.isDeadlineEnabled(),
                preferences.isMentionEnabled()
        );
    }
}
