package com.agileflow.controller;

import com.agileflow.dto.UpdateUserStoryRequest;
import com.agileflow.dto.UserStoryDTO;
import com.agileflow.service.UserStoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user-stories")
@RequiredArgsConstructor
public class UserStoryController {

    private final UserStoryService userStoryService;

    @PutMapping("/{storyId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_MANAGER')")
    public UserStoryDTO updateStory(@PathVariable Long storyId, @Valid @RequestBody UpdateUserStoryRequest request) {
        return userStoryService.updateStory(storyId, request);
    }

    @DeleteMapping("/{storyId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_MANAGER')")
    public ResponseEntity<Void> deleteStory(@PathVariable Long storyId) {
        userStoryService.deleteStory(storyId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{storyId}/assign-sprint/{sprintId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_MANAGER')")
    public UserStoryDTO assignSprint(@PathVariable Long storyId, @PathVariable Long sprintId) {
        return userStoryService.assignToSprint(storyId, sprintId);
    }

    @DeleteMapping("/{storyId}/assign-sprint")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_MANAGER')")
    public UserStoryDTO removeSprint(@PathVariable Long storyId) {
        return userStoryService.removeFromSprint(storyId);
    }
}
