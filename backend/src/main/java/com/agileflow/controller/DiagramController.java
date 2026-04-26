package com.agileflow.controller;

import com.agileflow.dto.CreateDiagramRequest;
import com.agileflow.dto.DiagramDTO;
import com.agileflow.dto.UpdateDiagramRequest;
import com.agileflow.service.DiagramService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

@RestController
@RequestMapping("/api/diagrams")
@RequiredArgsConstructor
public class DiagramController {

    private final DiagramService diagramService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<DiagramDTO> listDiagrams(@RequestParam(required = false) Long projectId) {
        return diagramService.listDiagrams(projectId);
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

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteDiagram(@PathVariable Long id) {
        diagramService.deleteDiagram(id);
        return ResponseEntity.noContent().build();
    }
}
