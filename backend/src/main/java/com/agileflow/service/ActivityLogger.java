package com.agileflow.service;

import com.agileflow.entity.ActivityLog;
import com.agileflow.entity.Project;
import com.agileflow.entity.Sprint;
import com.agileflow.entity.Task;
import com.agileflow.entity.User;

public interface ActivityLogger {
    void log(User actor, ActivityLog.Action action, String message, Project project, Sprint sprint, Task task);
}
