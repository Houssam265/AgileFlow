package com.agileflow.controller;

import com.agileflow.dto.AddDiagramCollaboratorRequest;
import com.agileflow.dto.CreateDiagramRequest;
import com.agileflow.dto.DiagramDTO;
import com.agileflow.dto.UpdateDiagramRequest;
import com.agileflow.service.DiagramService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/diagrams")
@RequiredArgsConstructor
public class DiagramController {

    private final DiagramService diagramService;
    private final ObjectMapper objectMapper;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<DiagramDTO> listDiagrams(@RequestParam(required = false) Long projectId) {
        return diagramService.listDiagrams(projectId);
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("isAuthenticated()")
    public List<DiagramDTO> getByProject(@PathVariable Long projectId) {
        return diagramService.getDiagramsByProject(projectId);
    }

    @GetMapping("/task/{taskId}")
    @PreAuthorize("isAuthenticated()")
    public List<DiagramDTO> getByTask(@PathVariable Long taskId) {
        return diagramService.getDiagramsByTask(taskId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public DiagramDTO getDiagram(@PathVariable Long id) {
        return diagramService.getDiagram(id);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DiagramDTO> createDiagram(@Valid @RequestBody CreateDiagramRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(diagramService.createDiagram(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public DiagramDTO updateDiagram(@PathVariable Long id, @Valid @RequestBody UpdateDiagramRequest request) {
        return diagramService.updateDiagram(id, request);
    }

    @PutMapping("/{id}/content")
    @PreAuthorize("isAuthenticated()")
    public DiagramDTO updateContent(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Object content = request.get("content");
        if (content != null) {
            return diagramService.updateContent(id, String.valueOf(content));
        }
        return diagramService.saveDiagram(id, objectMapper.convertValue(request, DiagramDTO.class));
    }

    @PostMapping("/{id}/collaborators")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> addCollaborator(
            @PathVariable Long id,
            @Valid @RequestBody AddDiagramCollaboratorRequest request
    ) {
        diagramService.addCollaborator(id, request.userId(), request.effectivePermission());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/{id}/collaborators")
    @PreAuthorize("isAuthenticated()")
    public List<Map<String, Object>> getCollaborators(@PathVariable Long id) {
        return diagramService.getCollaborators(id);
    }

    @DeleteMapping("/{id}/collaborators/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> removeCollaborator(@PathVariable Long id, @PathVariable Long userId) {
        diagramService.removeCollaborator(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/{id}/export/{format}", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    @PreAuthorize("isAuthenticated()")
    public byte[] export(@PathVariable Long id, @PathVariable String format) {
        return diagramService.exportDiagram(id, format);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteDiagram(@PathVariable Long id) {
        diagramService.deleteDiagram(id);
        return ResponseEntity.noContent().build();
    }
}
