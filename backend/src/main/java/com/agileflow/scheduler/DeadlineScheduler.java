package com.agileflow.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DeadlineScheduler {

    private final PriorityUpdater priorityUpdater;

    @Scheduled(fixedRate = 3600000)
    public void runUrgentDeadlineScan() {
        int updatedCount = priorityUpdater.updateUrgentTasks();
        int reminders24h = priorityUpdater.send24hReminders();
        int reminders1h = priorityUpdater.send1hReminders();
        log.debug("Scan des priorites intelligentes termine. {} tache(s) mise(s) a jour.", updatedCount);
        log.debug("Rappels deadline envoyes. 24h: {}, 1h: {}.", reminders24h, reminders1h);
    }
}
