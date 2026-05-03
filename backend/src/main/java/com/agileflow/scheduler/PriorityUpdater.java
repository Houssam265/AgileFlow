package com.agileflow.scheduler;

import com.agileflow.entity.Task;
import com.agileflow.repository.TaskRepository;
import com.agileflow.service.EmailNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PriorityUpdater {

    private final TaskRepository taskRepository;
    private final EmailNotificationService emailNotificationService;

    @Transactional
    public int updateUrgentTasks() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime urgentUntil = now.plusHours(24);

        List<Task> tasksToEscalate = taskRepository.findTasksBecomingUrgent(now, urgentUntil);
        for (Task task : tasksToEscalate) {
            task.setUrgent(true);
        }
        taskRepository.saveAll(tasksToEscalate);

        for (Task task : tasksToEscalate) {
            emailNotificationService.sendUrgentDeadlineAlert(task);
        }

        if (!tasksToEscalate.isEmpty()) {
            log.info("{} tache(s) marquee(s) URGENT lors du scan des deadlines.", tasksToEscalate.size());
        }
        return tasksToEscalate.size();
    }

    @Transactional
    public int send24hReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime deadlineThreshold = now.plusHours(24);
        List<Task> tasks = taskRepository.findTasksFor24hReminder(now, deadlineThreshold);
        for (Task task : tasks) {
            emailNotificationService.sendDeadlineReminder(task, "24 heures");
            task.setDeadline24hReminderSent(true);
        }
        taskRepository.saveAll(tasks);
        return tasks.size();
    }

    @Transactional
    public int send1hReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime deadlineThreshold = now.plusHours(1);
        List<Task> tasks = taskRepository.findTasksFor1hReminder(now, deadlineThreshold);
        for (Task task : tasks) {
            emailNotificationService.sendDeadlineReminder(task, "1 heure");
            task.setDeadline1hReminderSent(true);
        }
        taskRepository.saveAll(tasks);
        return tasks.size();
    }
}
