package com.agileflow.controller;

import com.agileflow.dto.AdminAnnouncementRequest;
import com.agileflow.dto.ActivityLogDTO;
import com.agileflow.dto.AdminDashboardDTO;
import com.agileflow.entity.ActivityLog;
import com.agileflow.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public AdminDashboardDTO dashboard() {
        return adminService.getDashboard();
    }

    @GetMapping("/activity-logs")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public Page<ActivityLogDTO> activityLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long actorId,
            @RequestParam(required = false) ActivityLog.Action action,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        return adminService.getActivityLogs(page, size, q, projectId, actorId, action, startDate, endDate);
    }

    @PostMapping("/announcements")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public Map<String, Integer> sendAnnouncement(@Valid @RequestBody AdminAnnouncementRequest request) {
        return Map.of("sentCount", adminService.sendAnnouncement(request));
    }
}
