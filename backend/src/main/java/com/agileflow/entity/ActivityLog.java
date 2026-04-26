package com.agileflow.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "activity_logs",
        indexes = {
                @Index(name = "idx_activity_logs_date", columnList = "activity_date"),
                @Index(name = "idx_activity_logs_actor", columnList = "actor_id"),
                @Index(name = "idx_activity_logs_project", columnList = "project_id"),
                @Index(name = "idx_activity_logs_sprint", columnList = "sprint_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "actor_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private User actor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sprint_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private Sprint sprint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private Task task;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Action action;

    @Column(length = 500)
    private String message;

    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (activityDate == null) {
            activityDate = createdAt.toLocalDate();
        }
    }

    public enum Action {
        PROJECT_CREATED,
        PROJECT_UPDATED,
        SPRINT_CREATED,
        SPRINT_UPDATED,
        SPRINT_STARTED,
        SPRINT_FINISHED,
        TASK_CREATED,
        TASK_UPDATED,
        TASK_MOVED,
        TASK_ASSIGNED,
        TASK_DELETED,
        TASK_COMPLETED,
        STORY_CREATED,
        STORY_UPDATED,
        STORY_DELETED,
        STORY_PLANNED,
        STORY_UNPLANNED
    }
}
