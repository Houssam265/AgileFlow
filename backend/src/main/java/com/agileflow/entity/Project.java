package com.agileflow.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "projects")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nom;
    private String description;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Statut statut = Statut.ACTIF;
    @ManyToOne
    @JoinColumn(name = "manager_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User manager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Team team;

    @OneToMany(mappedBy = "project")
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Sprint> sprints = new ArrayList<>();

    @OneToOne(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Backlog backlog;

    public enum Statut {
        ACTIF, ARCHIVE, TERMINE
    }
}
