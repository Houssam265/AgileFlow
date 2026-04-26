package com.agileflow.controller;

import com.agileflow.dto.SprintDTO;
import com.agileflow.service.SprintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sprints")
@RequiredArgsConstructor
public class SprintController {

    private final SprintService sprintService;

    @GetMapping("/projet/{projectId}")
    @PreAuthorize("isAuthenticated()")
    public List<SprintDTO> getSprintsByProject(@PathVariable Long projectId) {
        return sprintService.getSprintsByProject(projectId);
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_MANAGER')")
    public ResponseEntity<SprintDTO> createSprint(@RequestBody SprintDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sprintService.createSprint(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_MANAGER')")
    public SprintDTO updateSprint(@PathVariable Long id, @RequestBody SprintDTO dto) {
        return sprintService.updateSprint(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_MANAGER')")
    public ResponseEntity<Void> deleteSprint(@PathVariable Long id) {
        sprintService.deleteSprint(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/demarrer")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_MANAGER')")
    public SprintDTO startSprint(@PathVariable Long id) {
        return sprintService.startSprint(id);
    }

    @PostMapping("/{id}/terminer")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_MANAGER')")
    public SprintDTO finishSprint(@PathVariable Long id) {
        return sprintService.finishSprint(id);
    }
}
