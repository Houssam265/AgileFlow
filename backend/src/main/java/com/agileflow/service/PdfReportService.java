package com.agileflow.service;

import com.agileflow.dto.StatsDTO;
import com.agileflow.dto.VelocityPointDTO;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class PdfReportService {

    public byte[] generateStatsReport(StatsDTO stats) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PdfWriter writer = new PdfWriter(out);
             PdfDocument pdf = new PdfDocument(writer);
             Document document = new Document(pdf)) {

            document.add(new Paragraph("AgileFlow - Stats & Rapports").setBold().setFontSize(18));
            document.add(new Paragraph("Periode: " + stats.startDate() + " - " + stats.endDate()));
            document.add(new Paragraph("Taches: " + stats.totalTasks()
                    + " | Terminees: " + stats.completedTasks()
                    + " | Progression: " + stats.completionRate() + "%"));
            document.add(new Paragraph("Sprints actifs: " + stats.activeSprints()
                    + " | Velocite moyenne: " + stats.averageVelocity()));

            Table table = new Table(UnitValue.createPercentArray(new float[]{4, 2, 2, 2, 2})).useAllAvailableWidth();
            table.addHeaderCell(new Cell().add(new Paragraph("Sprint")));
            table.addHeaderCell(new Cell().add(new Paragraph("Total")));
            table.addHeaderCell(new Cell().add(new Paragraph("Done")));
            table.addHeaderCell(new Cell().add(new Paragraph("Points")));
            table.addHeaderCell(new Cell().add(new Paragraph("Capacite")));
            for (VelocityPointDTO point : stats.velocity()) {
                table.addCell(point.sprintName());
                table.addCell(String.valueOf(point.totalTasks()));
                table.addCell(String.valueOf(point.completedTasks()));
                table.addCell(String.valueOf(point.completedStoryPoints()));
                table.addCell(String.valueOf(point.capacityPoints()));
            }
            document.add(table);
        } catch (IOException e) {
            throw new IllegalStateException("Impossible de generer le rapport PDF", e);
        }
        return out.toByteArray();
    }
}
