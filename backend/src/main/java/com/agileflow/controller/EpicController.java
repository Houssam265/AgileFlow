package com.agileflow.controller;

import com.agileflow.dto.CreateEpicRequest;
import com.agileflow.dto.EpicDTO;
import com.agileflow.dto.UpdateEpicRequest;
import com.agileflow.service.EpicService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/epics")
@RequiredArgsConstructor
public class EpicController {

    private final EpicService epicService;

    @GetMapping("/project/{projectId}")
    @PreAuthorize("isAuthenticated()")
    public List<EpicDTO> listByProject(@PathVariable Long projectId) {
        return epicService.listByProject(projectId);
    }

    @PostMapping("/project/{projectId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<EpicDTO> create(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateEpicRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(epicService.create(projectId, request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public EpicDTO update(@PathVariable Long id, @Valid @RequestBody UpdateEpicRequest request) {
        return epicService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        epicService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
