package com.agileflow.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nom;
    private String prenom;
    @Column(unique = true, nullable = false)
    private String email;
    private String password;
    @Enumerated(EnumType.STRING)
    private Role role;
    @Builder.Default
    private boolean actif = true;
    @Builder.Default
    private LocalDateTime dateCreation = LocalDateTime.now();

    /** Dernière connexion réussie (login). */
    private LocalDateTime dateDerniereConnexion;

    public enum Role {
        ROLE_ADMIN, ROLE_MANAGER, ROLE_DEVELOPER
    }
}