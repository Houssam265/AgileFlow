package com.agileflow.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String message;
    @Builder.Default
    private boolean lu = false;
    @Builder.Default
    private LocalDateTime dateCreation = LocalDateTime.now();
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}