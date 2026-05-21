package com.agileflow.dto;

public record DiagramUpdateMessage(
        Type type,
        Long diagramId,
        Long userId,
        String userName,
        String userColor,
        Object payload
) {
    public enum Type {
        NODE_ADDED,
        NODE_MOVED,
        NODE_UPDATED,
        NODE_DELETED,
        EDGE_ADDED,
        EDGE_UPDATED,
        EDGE_DELETED,
        CURSOR_MOVE,
        SELECTION_CHANGE,
        DIAGRAM_TITLE,
        FULL_SYNC,
        JOIN,
        LEAVE,
        ELEMENT_LOCK,
        ELEMENT_UNLOCK,
        CONTENT_UPDATE
    }
}
