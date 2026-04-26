package com.agileflow.service;

import com.agileflow.dto.StatsDTO;
import com.agileflow.dto.VelocityPointDTO;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class CsvExportService {

    public byte[] generateStatsCsv(StatsDTO stats) {
        StringBuilder csv = new StringBuilder();
        csv.append("metric,value\n");
        csv.append("totalTasks,").append(stats.totalTasks()).append('\n');
        csv.append("todoTasks,").append(stats.todoTasks()).append('\n');
        csv.append("inProgressTasks,").append(stats.inProgressTasks()).append('\n');
        csv.append("reviewTasks,").append(stats.reviewTasks()).append('\n');
        csv.append("completedTasks,").append(stats.completedTasks()).append('\n');
        csv.append("completionRate,").append(stats.completionRate()).append('\n');
        csv.append("activeSprints,").append(stats.activeSprints()).append('\n');
        csv.append("averageVelocity,").append(stats.averageVelocity()).append("\n\n");

        csv.append("sprint,totalTasks,completedTasks,completedStoryPoints,capacityPoints\n");
        for (VelocityPointDTO point : stats.velocity()) {
            csv.append(escape(point.sprintName())).append(',')
                    .append(point.totalTasks()).append(',')
                    .append(point.completedTasks()).append(',')
                    .append(point.completedStoryPoints()).append(',')
                    .append(point.capacityPoints()).append('\n');
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escape(String value) {
        if (value == null) return "";
        String escaped = value.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }
}
