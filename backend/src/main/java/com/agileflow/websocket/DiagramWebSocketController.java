package com.agileflow.websocket;

import com.agileflow.dto.DiagramUpdateMessage;
import com.agileflow.dto.PresenceMessage;
import com.agileflow.entity.User;
import com.agileflow.repository.UserRepository;
import com.agileflow.service.DiagramService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;

@Controller
@RequiredArgsConstructor
public class DiagramWebSocketController {

    private final DiagramService diagramService;
    private final UserRepository userRepository;

    @MessageMapping("/diagram/{diagramId}")
    @SendTo("/topic/diagram/{diagramId}")
    public DiagramUpdateMessage handleDiagramUpdate(
            @DestinationVariable Long diagramId,
            @Payload DiagramUpdateMessage message,
            Principal principal
    ) {
        DiagramUpdateMessage enriched = enrich(diagramId, message, principal);
        if (enriched.type() != DiagramUpdateMessage.Type.CURSOR_MOVE
                && enriched.type() != DiagramUpdateMessage.Type.SELECTION_CHANGE
                && enriched.type() != DiagramUpdateMessage.Type.JOIN
                && enriched.type() != DiagramUpdateMessage.Type.LEAVE) {
            diagramService.persistRealtimeUpdate(enriched);
        }
        return enriched;
    }

    @MessageMapping("/diagram/{diagramId}/join")
    @SendTo("/topic/diagram/{diagramId}/presence")
    public PresenceMessage handleJoin(@DestinationVariable Long diagramId, @Payload DiagramUpdateMessage message, Principal principal) {
        User user = resolveUser(principal);
        return new PresenceMessage(
                "JOIN",
                diagramId,
                user != null ? user.getId() : message.userId(),
                user != null ? displayName(user) : message.userName(),
                message.userColor(),
                LocalDateTime.now()
        );
    }

    @MessageMapping("/diagram/{diagramId}/leave")
    @SendTo("/topic/diagram/{diagramId}/presence")
    public PresenceMessage handleLeave(@DestinationVariable Long diagramId, @Payload DiagramUpdateMessage message, Principal principal) {
        User user = resolveUser(principal);
        return new PresenceMessage(
                "LEAVE",
                diagramId,
                user != null ? user.getId() : message.userId(),
                user != null ? displayName(user) : message.userName(),
                message.userColor(),
                LocalDateTime.now()
        );
    }

    private DiagramUpdateMessage enrich(Long diagramId, DiagramUpdateMessage message, Principal principal) {
        User user = resolveUser(principal);
        return new DiagramUpdateMessage(
                message.type(),
                diagramId,
                user != null ? user.getId() : message.userId(),
                user != null ? displayName(user) : message.userName(),
                message.userColor(),
                message.payload()
        );
    }

    private User resolveUser(Principal principal) {
        if (principal == null || principal.getName() == null) {
            return null;
        }
        return userRepository.findByEmail(principal.getName()).orElse(null);
    }

    private String displayName(User user) {
        String name = ((user.getPrenom() != null ? user.getPrenom() : "") + " " + (user.getNom() != null ? user.getNom() : "")).trim();
        return !name.isBlank() ? name : user.getEmail();
    }
}
