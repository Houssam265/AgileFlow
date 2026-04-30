package com.agileflow.controller;

import com.agileflow.dto.CommentDTO;
import com.agileflow.dto.CreateCommentRequest;
import com.agileflow.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks/{taskId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<CommentDTO> getComments(@PathVariable Long taskId) {
        return commentService.getCommentsByTask(taskId);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentDTO> createComment(
            @PathVariable Long taskId,
            @Valid @RequestBody CreateCommentRequest request
    ) {
        CommentDTO created = commentService.createComment(taskId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
