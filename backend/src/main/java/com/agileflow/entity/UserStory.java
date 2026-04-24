package com.agileflow.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_stories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority = Priority.MEDIUM;

    private Integer storyPoints;

    @Column(columnDefinition = "TEXT")
    private String acceptanceCriteria;

    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "backlog_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Backlog backlog;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sprint_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Sprint sprint;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (priority == null) {
            priority = Priority.MEDIUM;
        }
    }

    public enum Priority {
        LOW, MEDIUM, HIGH, CRITICAL
    }
}
