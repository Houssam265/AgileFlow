package com.agileflow.service;

import com.agileflow.dto.BurndownPointDTO;
import com.agileflow.dto.StatsDTO;
import com.agileflow.dto.VelocityPointDTO;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PdfReportServiceTest {

    private final PdfReportService pdfReportService = new PdfReportService();

    @Test
    void generateStatsReport_returnsPdfBytes() {
        StatsDTO stats = new StatsDTO(
                1L,
                2L,
                "2026-04-20",
                "2026-04-26",
                10,
                2,
                3,
                1,
                4,
                40.0,
                1,
                8.0,
                List.of(new BurndownPointDTO("2026-04-20", 10, 10)),
                List.of(new VelocityPointDTO(2L, "Sprint 1", 10, 4, 8, 20))
        );

        byte[] pdf = pdfReportService.generateStatsReport(stats);

        assertThat(pdf.length).isGreaterThan(100);
        assertThat(new String(Arrays.copyOf(pdf, 4), StandardCharsets.US_ASCII)).isEqualTo("%PDF");
    }
}
