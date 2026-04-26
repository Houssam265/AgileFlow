package com.agileflow.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "sprints")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sprint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nom;
    private String description;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private Integer capacitePoints;
    @Builder.Default
    private Integer pointsUtilises = 0;
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Statut statut = Statut.PLANIFIE;
    @ManyToOne
    @JoinColumn(name = "project_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Project project;

    public String getNumero() {
        return nom;
    }

    public enum Statut {
        PLANIFIE, ACTIF, FERME
    }
}
