package com.agileflow.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

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
    private Statut statut = Statut.ACTIF;
    @ManyToOne
    @JoinColumn(name = "manager_id")
    private User manager;

    public enum Statut {
        ACTIF, ARCHIVE, TERMINE
    }
}