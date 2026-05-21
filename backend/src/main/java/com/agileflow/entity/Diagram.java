package com.agileflow.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "diagrams")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Diagram {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 150)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false, length = 150)
    private String titre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Type type;

    @Lob
    @Column(name = "etapes_json", nullable = false, columnDefinition = "TEXT")
    private String etapesJson;

    @Lob
    @Column(name = "contenu_json", nullable = false, columnDefinition = "TEXT")
    private String json;

    @Lob
    @Column(name = "canvas_data", columnDefinition = "LONGTEXT")
    private String canvasData;

    @Builder.Default
    @Column(name = "is_shared")
    private Boolean isShared = false;

    @Column(name = "thumbnail_url", length = 1000)
    private String thumbnailUrl;

    @Builder.Default
    @Column(nullable = false)
    private boolean shared = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Task task;

    @Builder.Default
    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "diagram", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<DiagramNode> nodes = new ArrayList<>();

    @OneToMany(mappedBy = "diagram", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<DiagramEdge> edges = new ArrayList<>();

    @OneToMany(mappedBy = "diagram", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<DiagramCollaborator> collaborators = new ArrayList<>();

    @PrePersist
    void onCreate() {
        syncCompatibilityFields();
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = createdAt;
        }
    }

    @PreUpdate
    void touch() {
        syncCompatibilityFields();
        updatedAt = LocalDateTime.now();
    }

    public String getDisplayTitle() {
        return title != null && !title.isBlank() ? title : titre;
    }

    public boolean isEffectivelyShared() {
        return Boolean.TRUE.equals(isShared) || shared;
    }

    public User getEffectiveOwner() {
        return createdBy != null ? createdBy : owner;
    }

    public void setTitle(String title) {
        this.title = title;
        this.titre = title;
    }

    public void setTitre(String titre) {
        this.titre = titre;
        this.title = titre;
    }

    public void setCanvasData(String canvasData) {
        this.canvasData = canvasData;
        if (this.json == null || this.json.isBlank()) {
            this.json = canvasData;
        }
    }

    public void setJson(String json) {
        this.json = json;
        if (this.canvasData == null || this.canvasData.isBlank()) {
            this.canvasData = json;
        }
    }

    public void setIsShared(Boolean shared) {
        this.isShared = shared;
        this.shared = Boolean.TRUE.equals(shared);
    }

    public void setShared(boolean shared) {
        this.shared = shared;
        this.isShared = shared;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
        if (this.owner == null) {
            this.owner = createdBy;
        }
    }

    public void setOwner(User owner) {
        this.owner = owner;
        if (this.createdBy == null) {
            this.createdBy = owner;
        }
    }

    private void syncCompatibilityFields() {
        if (title == null || title.isBlank()) {
            title = titre;
        }
        if (titre == null || titre.isBlank()) {
            titre = title;
        }
        if (createdBy == null) {
            createdBy = owner;
        }
        if (owner == null) {
            owner = createdBy;
        }
        if (canvasData == null || canvasData.isBlank()) {
            canvasData = json;
        }
        if (json == null || json.isBlank()) {
            json = canvasData;
        }
        if (isShared == null) {
            isShared = shared;
        } else {
            shared = Boolean.TRUE.equals(isShared);
        }
        if (etapesJson == null || etapesJson.isBlank()) {
            etapesJson = "[]";
        }
    }

    public enum Type {
        FLOWCHART, PROCESS, DECISION, UML, BPMN, ERD, NETWORK, MINDMAP,
        USE_CASE, CLASS, SEQUENCE, ACTIVITY, COMPONENT, DEPLOYMENT, CUSTOM
    }
}
