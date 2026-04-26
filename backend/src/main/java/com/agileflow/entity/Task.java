package com.agileflow.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

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
    @Builder.Default
    private Statut statut = Statut.TODO;
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Priorite priorite = Priorite.MEDIUM;
    private LocalDate dateEcheance;
    @ManyToOne
    @JoinColumn(name = "assigned_to")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User assignedTo;
    @ManyToOne
    @JoinColumn(name = "sprint_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Sprint sprint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private UserStory story;

    @ElementCollection
    @CollectionTable(name = "task_labels", joinColumns = @JoinColumn(name = "task_id"))
    @Column(name = "label")
    @Builder.Default
    private Set<String> labels = new HashSet<>();

    public enum Statut {
        TODO, IN_PROGRESS, REVIEW, DONE
    }
    public enum Priorite {
        LOW, MEDIUM, HIGH, CRITICAL
    }
}
