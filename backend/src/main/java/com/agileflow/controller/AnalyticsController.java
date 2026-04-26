package com.agileflow.controller;

import com.agileflow.dto.AnalyticsDTO;
import com.agileflow.dto.AnalyticsPeriod;
import com.agileflow.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public AnalyticsDTO getAnalytics(
            @RequestParam(defaultValue = "WEEK") AnalyticsPeriod period,
            @RequestParam(required = false) Long sprintId
    ) {
        return analyticsService.getAnalytics(period, sprintId);
    }

    @GetMapping(value = "/export.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(defaultValue = "WEEK") AnalyticsPeriod period,
            @RequestParam(required = false) Long sprintId
    ) {
        byte[] pdf = analyticsService.exportAnalyticsPdf(period, sprintId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("agileflow-analytics.pdf").build().toString())
                .body(pdf);
    }
}
