package com.agileflow.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_email_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEmailPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Builder.Default
    @Column(name = "sprint_start_enabled", nullable = false)
    private boolean sprintStartEnabled = true;

    @Builder.Default
    @Column(name = "task_assigned_enabled", nullable = false)
    private boolean taskAssignedEnabled = true;

    @Builder.Default
    @Column(name = "deadline_enabled", nullable = false)
    private boolean deadlineEnabled = true;

    @Builder.Default
    @Column(name = "mention_enabled", nullable = false)
    private boolean mentionEnabled = true;
}
