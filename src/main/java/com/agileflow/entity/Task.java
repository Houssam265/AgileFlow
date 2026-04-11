package com.agileflow.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String titre;
    private String description;
    @Enumerated(EnumType.STRING)
    private Statut statut = Statut.TODO;
    @Enumerated(EnumType.STRING)
    private Priorite priorite = Priorite.MEDIUM;
    private LocalDate dateEcheance;
    @ManyToOne
    @JoinColumn(name = "assigned_to")
    private User assignedTo;
    @ManyToOne
    @JoinColumn(name = "sprint_id")
    private Sprint sprint;

    public enum Statut {
        TODO, IN_PROGRESS, REVIEW, DONE
    }
    public enum Priorite {
        LOW, MEDIUM, HIGH, CRITICAL
    }
}