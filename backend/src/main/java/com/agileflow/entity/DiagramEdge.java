package com.agileflow.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "diagram_edges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiagramEdge {

    @Id
    @Column(length = 80)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diagram_id", nullable = false)
    private Diagram diagram;

    @Column(nullable = false, length = 80)
    private String sourceNodeId;

    @Column(nullable = false, length = 80)
    private String targetNodeId;

    @Column(length = 20)
    private String sourceHandle;

    @Column(length = 20)
    private String targetHandle;

    @Column(length = 30)
    private String edgeType;

    @Column(length = 30)
    private String arrowStart;

    @Column(length = 30)
    private String arrowEnd;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String data;
}
