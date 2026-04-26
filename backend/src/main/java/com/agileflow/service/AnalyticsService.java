package com.agileflow.service;

import com.agileflow.dto.ActivityHeatmapDTO;
import com.agileflow.dto.AnalyticsDTO;
import com.agileflow.dto.AnalyticsMemberStatsDTO;
import com.agileflow.dto.AnalyticsPeriod;
import com.agileflow.dto.AnalyticsTrendDTO;
import com.agileflow.entity.Sprint;
import com.agileflow.entity.User;
import com.agileflow.exception.BadRequestException;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.ActivityLogRepository;
import com.agileflow.repository.SprintRepository;
import com.agileflow.repository.UserRepository;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final SprintRepository sprintRepository;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur courant introuvable"));
    }

    @Transactional(readOnly = true)
    public AnalyticsDTO getAnalytics(AnalyticsPeriod period, Long sprintId) {
        User actor = currentUser();
        DateRange range = resolveDateRange(period, sprintId);
        Scope scope = resolveScope(actor);

        long totalActivities = activityLogRepository.countForScope(
                range.startDate(), range.endDate(), range.sprintId(), scope.managerId(), scope.actorId());
        long activeMembers = activityLogRepository.countActiveMembersForScope(
                range.startDate(), range.endDate(), range.sprintId(), scope.managerId(), scope.actorId());
        List<AnalyticsMemberStatsDTO> memberStats = memberStats(range, scope);
        List<ActivityHeatmapDTO> heatmap = heatmap(range, scope);
        List<AnalyticsTrendDTO> trend = trend(range, scope);
        long completedTasks = trend.stream().mapToLong(AnalyticsTrendDTO::completedTasks).sum();

        return new AnalyticsDTO(
                periodOrDefault(period).name(),
                range.startDate().toString(),
                range.endDate().toString(),
                range.sprintId(),
                totalActivities,
                completedTasks,
                activeMembers,
                memberStats,
                heatmap,
                trend
        );
    }

    @Transactional(readOnly = true)
    public byte[] exportAnalyticsPdf(AnalyticsPeriod period, Long sprintId) {
        AnalyticsDTO analytics = getAnalytics(period, sprintId);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try (PdfWriter writer = new PdfWriter(out);
             PdfDocument pdf = new PdfDocument(writer);
             Document document = new Document(pdf)) {

            document.add(new Paragraph("AgileFlow - Analytics Dashboard v2.0").setBold().setFontSize(18));
            document.add(new Paragraph("Periode: " + analytics.period()
                    + " | Du " + analytics.startDate()
                    + " au " + analytics.endDate()));
            document.add(new Paragraph("Activites: " + analytics.totalActivities()
                    + " | Taches terminees: " + analytics.completedTasks()
                    + " | Membres actifs: " + analytics.activeMembers()));

            Table table = new Table(UnitValue.createPercentArray(new float[]{4, 2, 2})).useAllAvailableWidth();
            table.addHeaderCell(new Cell().add(new Paragraph("Membre")));
            table.addHeaderCell(new Cell().add(new Paragraph("Activites")));
            table.addHeaderCell(new Cell().add(new Paragraph("Taches terminees")));
            for (AnalyticsMemberStatsDTO member : analytics.memberStats()) {
                table.addCell(member.memberName());
                table.addCell(String.valueOf(member.activityCount()));
                table.addCell(String.valueOf(member.completedTasks()));
            }
            document.add(table);
        } catch (IOException e) {
            throw new IllegalStateException("Impossible de generer le PDF analytics", e);
        }

        return out.toByteArray();
    }

    private List<AnalyticsMemberStatsDTO> memberStats(DateRange range, Scope scope) {
        return activityLogRepository.aggregateByMember(
                        range.startDate(), range.endDate(), range.sprintId(), scope.managerId(), scope.actorId())
                .stream()
                .map(row -> {
                    String fullName = String.valueOf(row[1]).trim();
                    String fallbackEmail = String.valueOf(row[2]);
                    return new AnalyticsMemberStatsDTO(
                            (Long) row[0],
                            fullName.isBlank() ? fallbackEmail : fullName,
                            String.valueOf(row[3]),
                            number(row[4]),
                            number(row[5])
                    );
                })
                .toList();
    }

    private List<ActivityHeatmapDTO> heatmap(DateRange range, Scope scope) {
        Map<LocalDate, Long> values = new HashMap<>();
        for (Object[] row : activityLogRepository.aggregateByDate(
                range.startDate(), range.endDate(), range.sprintId(), scope.managerId(), scope.actorId())) {
            values.put((LocalDate) row[0], number(row[1]));
        }

        List<ActivityHeatmapDTO> heatmap = new ArrayList<>();
        LocalDate cursor = range.startDate();
        while (!cursor.isAfter(range.endDate())) {
            heatmap.add(new ActivityHeatmapDTO(cursor.toString(), values.getOrDefault(cursor, 0L)));
            cursor = cursor.plusDays(1);
        }
        return heatmap;
    }

    private List<AnalyticsTrendDTO> trend(DateRange range, Scope scope) {
        Map<LocalDate, Object[]> values = new HashMap<>();
        for (Object[] row : activityLogRepository.aggregateTrendByDate(
                range.startDate(), range.endDate(), range.sprintId(), scope.managerId(), scope.actorId())) {
            values.put((LocalDate) row[0], row);
        }

        List<AnalyticsTrendDTO> trend = new ArrayList<>();
        LocalDate cursor = range.startDate();
        while (!cursor.isAfter(range.endDate())) {
            Object[] row = values.get(cursor);
            trend.add(new AnalyticsTrendDTO(
                    cursor.toString(),
                    row != null ? number(row[1]) : 0,
                    row != null ? number(row[2]) : 0
            ));
            cursor = cursor.plusDays(1);
        }
        return trend;
    }

    private DateRange resolveDateRange(AnalyticsPeriod requestedPeriod, Long sprintId) {
        AnalyticsPeriod period = periodOrDefault(requestedPeriod);
        LocalDate today = LocalDate.now();
        return switch (period) {
            case WEEK -> new DateRange(today.minusDays(6), today, sprintId);
            case MONTH -> new DateRange(today.minusDays(29), today, sprintId);
            case SPRINT -> {
                if (sprintId == null) {
                    throw new BadRequestException("Le filtre SPRINT exige un sprintId.");
                }
                Sprint sprint = sprintRepository.findById(sprintId)
                        .orElseThrow(() -> new ResourceNotFoundException("Sprint introuvable"));
                if (sprint.getDateDebut() == null || sprint.getDateFin() == null) {
                    throw new BadRequestException("Le sprint doit avoir une date de debut et une date de fin.");
                }
                yield new DateRange(sprint.getDateDebut(), sprint.getDateFin(), sprintId);
            }
        };
    }

    private AnalyticsPeriod periodOrDefault(AnalyticsPeriod period) {
        return period == null ? AnalyticsPeriod.WEEK : period;
    }

    private Scope resolveScope(User actor) {
        return switch (actor.getRole()) {
            case ROLE_ADMIN -> new Scope(null, null);
            case ROLE_MANAGER -> new Scope(actor.getId(), null);
            case ROLE_DEVELOPER -> new Scope(null, actor.getId());
        };
    }

    private long number(Object value) {
        return value == null ? 0 : ((Number) value).longValue();
    }

    private record DateRange(LocalDate startDate, LocalDate endDate, Long sprintId) {
    }

    private record Scope(Long managerId, Long actorId) {
    }
}
