package com.agileflow.controller;

import com.agileflow.dto.*;
import com.agileflow.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<TaskDTO> getTasks(
            @RequestParam(required = false) Long sprintId,
            @RequestParam(required = false) Long projectId) {
        if (sprintId != null) {
            return taskService.getTasksBySprint(sprintId);
        } else if (projectId != null) {
            return taskService.getTasksByProject(projectId);
        }
        throw new IllegalArgumentException("sprintId ou projectId doit être fourni");
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_MANAGER')")
    public ResponseEntity<TaskDTO> createTask(@Valid @RequestBody CreateTaskRequest request) {
        TaskDTO created = taskService.createTask(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_MANAGER')")
    public TaskDTO updateTask(@PathVariable Long id, @Valid @RequestBody UpdateTaskRequest request) {
        return taskService.updateTask(id, request);
    }

    @PutMapping("/{id}/move")
    @PreAuthorize("isAuthenticated()")
    public TaskDTO moveTask(@PathVariable Long id, @Valid @RequestBody MoveTaskRequest request) {
        return taskService.moveTask(id, request);
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_MANAGER')")
    public TaskDTO assignTask(@PathVariable Long id, @Valid @RequestBody AssignTaskRequest request) {
        return taskService.assignTask(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_MANAGER')")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}
