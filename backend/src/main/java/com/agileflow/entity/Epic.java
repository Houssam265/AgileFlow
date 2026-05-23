package com.agileflow.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "epics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Epic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EpicStatus statut = EpicStatus.TODO;

    @Column(length = 7)
    @Builder.Default
    private String color = "#6366F1";

    @Builder.Default
    private Integer sortOrder = 0;

    private LocalDate dateDebut;
    private LocalDate dateFin;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Project project;

    public enum EpicStatus {
        TODO, IN_PROGRESS, REVIEW, DONE
    }
}
