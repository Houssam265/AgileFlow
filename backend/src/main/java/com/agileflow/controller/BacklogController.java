package com.agileflow.controller;

import com.agileflow.dto.BacklogDTO;
import com.agileflow.dto.CreateUserStoryRequest;
import com.agileflow.dto.UserStoryDTO;
import com.agileflow.entity.UserStory;
import com.agileflow.service.UserStoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/backlogs")
@RequiredArgsConstructor
public class BacklogController {

    private final UserStoryService userStoryService;

    @GetMapping("/project/{projectId}")
    @PreAuthorize("isAuthenticated()")
    public BacklogDTO getBacklog(
            @PathVariable Long projectId,
            @RequestParam(required = false) UserStory.Priority priority
    ) {
        return userStoryService.getBacklogByProject(projectId, priority);
    }

    @PostMapping("/project/{projectId}/stories")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_MANAGER')")
    public ResponseEntity<UserStoryDTO> createStory(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateUserStoryRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userStoryService.createStory(projectId, request));
    }
}
