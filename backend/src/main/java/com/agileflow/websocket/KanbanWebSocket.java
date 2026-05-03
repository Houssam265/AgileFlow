package com.agileflow.websocket;

import com.agileflow.dto.AssignTaskRequest;
import com.agileflow.dto.KanbanEventDTO;
import com.agileflow.dto.MoveTaskRequest;
import com.agileflow.dto.TaskDTO;
import com.agileflow.entity.Task;
import com.agileflow.service.TaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class KanbanWebSocket {

    private final TaskService taskService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/kanban/move")
    public void handleTaskMove(@Payload Map<String, Object> payload) {
        try {
            Long taskId = Long.valueOf(payload.get("taskId").toString());
            Long projectId = Long.valueOf(payload.get("projectId").toString());
            
            // On récupère la tâche mise à jour depuis le payload envoyé par le client
            // Cela évite de devoir appeler le service (problème de SecurityContext)
            // Le client qui a fait le mouvement envoie l'état final
            Object taskObj = payload.get("updatedTask");
            
            log.info("Broadcasting move: taskId={} for project={}", taskId, projectId);

            KanbanEventDTO event = new KanbanEventDTO(
                "MOVE",
                taskId,
                null, // On peut passer null ici si le client gère l'ID ou renvoyer le DTO reçu
                projectId
            );
            
            // Pour être plus robuste, on renvoie tout l'objet reçu
            messagingTemplate.convertAndSend("/topic/kanban/" + projectId, payload);
            
        } catch (Exception e) {
            log.error("Error broadcasting task move: {}", e.getMessage());
        }
    }

    @MessageMapping("/kanban/assign")
    public void handleTaskAssign(@Payload Map<String, Object> payload) {
        try {
            Long taskId = Long.valueOf(payload.get("taskId").toString());
            Long projectId = Long.valueOf(payload.get("projectId").toString());

            log.info("Broadcasting assign: taskId={} for project={}", taskId, projectId);

            messagingTemplate.convertAndSend("/topic/kanban/" + projectId, payload);
            
        } catch (Exception e) {
            log.error("Error broadcasting task assign: {}", e.getMessage());
        }
    }
}