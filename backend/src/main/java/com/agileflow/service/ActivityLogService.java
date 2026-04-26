package com.agileflow.service;

import com.agileflow.entity.ActivityLog;
import com.agileflow.entity.Project;
import com.agileflow.entity.Sprint;
import com.agileflow.entity.Task;
import com.agileflow.entity.User;
import com.agileflow.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ActivityLogService implements ActivityLogger {

    private final ActivityLogRepository activityLogRepository;

    @Transactional(propagation = Propagation.MANDATORY)
    @Override
    public void log(User actor, ActivityLog.Action action, String message, Project project, Sprint sprint, Task task) {
        if (actor == null || action == null) {
            return;
        }
        activityLogRepository.save(ActivityLog.builder()
                .actor(actor)
                .action(action)
                .message(message)
                .project(project)
                .sprint(sprint)
                .task(task)
                .build());
    }
}
