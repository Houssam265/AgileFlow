package com.agileflow.controller;

import com.agileflow.dto.*;
import com.agileflow.service.ProjectMemberService;
import com.agileflow.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectMemberService projectMemberService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<ProjectDTO> listProjects(@RequestParam(required = false) String q) {
        return projectService.listProjects(q);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ProjectDTO getProject(@PathVariable Long id) {
        return projectService.getProjectById(id);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProjectDTO> createProject(@Valid @RequestBody CreateProjectRequest request) {
        ProjectDTO created = projectService.createProject(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ProjectDTO updateProject(@PathVariable Long id, @Valid @RequestBody UpdateProjectRequest request) {
        return projectService.updateProject(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/members")
    @PreAuthorize("isAuthenticated()")
    public List<ProjectMemberDTO> listMembers(@PathVariable Long id) {
        return projectMemberService.listMembers(id);
    }

    @PostMapping("/{id}/members/invite")
    @PreAuthorize("isAuthenticated()")
    public InviteProjectMemberResultDTO inviteMember(@PathVariable Long id, @RequestBody InviteProjectMemberRequest request) {
        return projectMemberService.inviteMember(id, request);
    }

    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        projectMemberService.removeMember(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/invitations/preview")
    @PreAuthorize("permitAll()")
    public ProjectInvitationPreviewDTO previewInvitation(@RequestParam String token) {
        return projectMemberService.previewInvitation(token);
    }

    @GetMapping("/{id}/invitations/pending")
    @PreAuthorize("isAuthenticated()")
    public List<ProjectInvitationDTO> listPendingInvitations(@PathVariable Long id) {
        return projectMemberService.listPendingInvitationsForProject(id);
    }

    @GetMapping("/invitations/received")
    @PreAuthorize("isAuthenticated()")
    public List<ProjectInvitationDTO> listReceivedInvitations() {
        return projectMemberService.listReceivedInvitations();
    }

    @PostMapping("/invitations/accept")
    @PreAuthorize("isAuthenticated()")
    public ProjectMemberDTO acceptInvitation(@RequestBody AcceptProjectInvitationRequest request) {
        return projectMemberService.acceptInvitation(request);
    }

    @PostMapping("/invitations/{id}/accept")
    @PreAuthorize("isAuthenticated()")
    public ProjectMemberDTO acceptInvitationById(@PathVariable Long id) {
        return projectMemberService.acceptInvitation(new AcceptProjectInvitationRequest(null, id));
    }

    @PostMapping("/invitations/reject")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> rejectInvitationByToken(@RequestBody AcceptProjectInvitationRequest request) {
        projectMemberService.rejectInvitation(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/invitations/{id}/reject")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> rejectInvitation(@PathVariable Long id) {
        projectMemberService.rejectInvitation(id);
        return ResponseEntity.noContent().build();
    }
}
