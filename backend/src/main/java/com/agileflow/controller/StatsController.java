package com.agileflow.controller;

import com.agileflow.dto.StatsDTO;
import com.agileflow.service.CsvExportService;
import com.agileflow.service.PdfReportService;
import com.agileflow.service.StatsService;
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
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;
    private final PdfReportService pdfReportService;
    private final CsvExportService csvExportService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public StatsDTO getStats(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long sprintId
    ) {
        return statsService.getStats(projectId, sprintId);
    }

    @GetMapping(value = "/export.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long sprintId
    ) {
        byte[] pdf = pdfReportService.generateStatsReport(statsService.getStats(projectId, sprintId));
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("agileflow-stats.pdf").build().toString())
                .body(pdf);
    }

    @GetMapping(value = "/export.csv", produces = "text/csv")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long sprintId
    ) {
        byte[] csv = csvExportService.generateStatsCsv(statsService.getStats(projectId, sprintId));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("agileflow-stats.csv").build().toString())
                .body(csv);
    }
}
