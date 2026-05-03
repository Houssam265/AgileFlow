package com.agileflow.service;

import com.agileflow.dto.DiagramDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DiagramNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void notifyDiagramCreated(Long projectId, DiagramDTO diagram, String authorName) {
        Map<String, Object> message = Map.of(
                "type", "DIAGRAM_CREATED",
                "projectId", projectId,
                "diagram", diagram,
                "authorName", authorName
        );
        String destination = "/topic/diagrams/" + projectId;
        messagingTemplate.convertAndSend(destination, message);
        log.info("Notification WebSocket envoyee pour diagramme cree: {} sur topic {}", diagram.id(), destination);
    }

    public void notifyDiagramShared(Long projectId, DiagramDTO diagram, String authorName) {
        Map<String, Object> message = Map.of(
                "type", "DIAGRAM_SHARED",
                "projectId", projectId,
                "diagram", diagram,
                "authorName", authorName,
                "message", authorName + " a partage un nouveau diagramme : " + diagram.titre()
        );
        String destination = "/topic/diagrams/" + projectId;
        messagingTemplate.convertAndSend(destination, message);
        log.info("Notification WebSocket envoyee pour diagramme partage: {} sur topic {}", diagram.id(), destination);
    }
}
