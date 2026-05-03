package com.agileflow.service;

import com.agileflow.dto.CreateDiagramRequest;
import com.agileflow.dto.DiagramDTO;
import com.agileflow.dto.UpdateDiagramRequest;
import com.agileflow.entity.Diagram;
import com.agileflow.entity.Notification;
import com.agileflow.entity.Project;
import com.agileflow.entity.Task;
import com.agileflow.entity.User;
import com.agileflow.exception.ForbiddenOperationException;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.DiagramRepository;
import com.agileflow.repository.NotificationRepository;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.TaskRepository;
import com.agileflow.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DiagramService {

    private final DiagramRepository diagramRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final NotificationRepository notificationRepository;
    private final DiagramNotificationService diagramNotificationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur courant introuvable"));
    }

    @Transactional(readOnly = true)
    public List<DiagramDTO> listDiagrams(Long projectId) {
        User actor = currentUser();
        Long actorId = isAdmin(actor) ? null : actor.getId();
        return diagramRepository.findVisible(projectId, actorId).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public DiagramDTO getDiagram(Long id) {
        Diagram diagram = findDiagram(id);
        User actor = currentUser();
        if (!canView(actor, diagram)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas consulter ce diagramme.");
        }
        return toDTO(diagram);
    }

    @Transactional
    public DiagramDTO createDiagram(CreateDiagramRequest request) {
        User actor = currentUser();
        Project project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"));
        if (!canCreateInProject(actor, project)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas creer un diagramme dans ce projet.");
        }

        Task task = null;
        if (request.taskId() != null) {
            task = taskRepository.findById(request.taskId())
                    .orElseThrow(() -> new ResourceNotFoundException("Tache introuvable"));
        }

        Diagram diagram = Diagram.builder()
                .titre(request.titre().trim())
                .type(request.type())
                .project(project)
                .owner(actor)
                .task(task)
                .etapesJson(writeSteps(request.etapes()))
                .json(resolveJson(request.titre(), request.type(), request.etapes(), request.json()))
                .shared(request.shared())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        diagramRepository.save(diagram);
        
        DiagramDTO diagramDTO = toDTO(diagram);
        String actorName = (actor.getPrenom() != null ? actor.getPrenom() : "") + " " + (actor.getNom() != null ? actor.getNom() : "");
        actorName = actorName.trim();
        
        diagramNotificationService.notifyDiagramCreated(project.getId(), diagramDTO, actorName);
        
        if (diagram.isShared()) {
            notifyShared(diagram, actor);
            diagramNotificationService.notifyDiagramShared(project.getId(), diagramDTO, actorName);
        }
        
        return diagramDTO;
    }

    @Transactional
    public DiagramDTO updateDiagram(Long id, UpdateDiagramRequest request) {
        Diagram diagram = findDiagram(id);
        User actor = currentUser();
        if (!canEdit(actor, diagram)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas modifier ce diagramme.");
        }
        boolean becameShared = !diagram.isShared() && request.shared();
        diagram.setTitre(request.titre().trim());
        diagram.setType(request.type());
        diagram.setEtapesJson(writeSteps(request.etapes()));
        diagram.setJson(resolveJson(request.titre(), request.type(), request.etapes(), request.json()));
        diagram.setShared(request.shared());
        diagramRepository.save(diagram);
        
        DiagramDTO diagramDTO = toDTO(diagram);
        String actorName = (actor.getPrenom() != null ? actor.getPrenom() : "") + " " + (actor.getNom() != null ? actor.getNom() : "");
        actorName = actorName.trim();
        
        if (becameShared) {
            notifyShared(diagram, actor);
            diagramNotificationService.notifyDiagramShared(diagram.getProject().getId(), diagramDTO, actorName);
        }
        
        return diagramDTO;
    }

    @Transactional
    public void deleteDiagram(Long id) {
        Diagram diagram = findDiagram(id);
        User actor = currentUser();
        if (!canEdit(actor, diagram)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas supprimer ce diagramme.");
        }
        diagramRepository.delete(diagram);
    }

    private Diagram findDiagram(Long id) {
        return diagramRepository.findWithRelationsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Diagramme introuvable"));
    }

    private boolean isAdmin(User user) {
        return user.getRole() == User.Role.ROLE_ADMIN;
    }

    private boolean canCreateInProject(User actor, Project project) {
        return isAdmin(actor)
                || actor.getRole() == User.Role.ROLE_DEVELOPER
                || (project.getManager() != null && project.getManager().getId().equals(actor.getId()));
    }

    private boolean canView(User actor, Diagram diagram) {
        return isAdmin(actor)
                || diagram.isShared()
                || diagram.getOwner().getId().equals(actor.getId())
                || (diagram.getProject().getManager() != null
                && diagram.getProject().getManager().getId().equals(actor.getId()));
    }

    private boolean canEdit(User actor, Diagram diagram) {
        return isAdmin(actor)
                || diagram.getOwner().getId().equals(actor.getId())
                || (diagram.getProject().getManager() != null
                && diagram.getProject().getManager().getId().equals(actor.getId()));
    }

    private DiagramDTO toDTO(Diagram diagram) {
        Project project = diagram.getProject();
        User owner = diagram.getOwner();
        Task task = diagram.getTask();
        return new DiagramDTO(
                diagram.getId(),
                diagram.getTitre(),
                diagram.getType(),
                readSteps(diagram.getEtapesJson()),
                diagram.getJson(),
                project != null ? project.getId() : null,
                project != null ? project.getNom() : null,
                owner != null ? owner.getId() : null,
                owner != null ? (owner.getPrenom() + " " + owner.getNom()).trim() : null,
                task != null ? task.getId() : null,
                task != null ? task.getTitre() : null,
                diagram.isShared(),
                diagram.getCreatedAt() != null ? diagram.getCreatedAt().toString() : null,
                diagram.getUpdatedAt() != null ? diagram.getUpdatedAt().toString() : null
        );
    }

    private String writeSteps(List<String> steps) {
        List<String> cleanSteps = steps.stream()
                .map(String::trim)
                .filter(step -> !step.isBlank())
                .toList();
        try {
            return objectMapper.writeValueAsString(cleanSteps);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Impossible de serialiser les etapes du diagramme.", e);
        }
    }

    private List<String> readSteps(String raw) {
        try {
            return objectMapper.readValue(raw, new TypeReference<>() {
            });
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private String resolveJson(String title, Diagram.Type type, List<String> steps, String json) {
        if (StringUtils.hasText(json)) {
            return json.trim();
        }
        try {
            return objectMapper.writeValueAsString(Map.of(
                    "title", title,
                    "type", type.name(),
                    "steps", steps,
                    "mermaid", buildMermaid(steps)
            ));
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Impossible de generer le JSON du diagramme.", e);
        }
    }

    private String buildMermaid(List<String> steps) {
        StringBuilder mermaid = new StringBuilder("flowchart TD\n");
        for (int i = 0; i < steps.size(); i++) {
            mermaid.append("  S").append(i + 1).append("[\"")
                    .append(steps.get(i).replace("\"", "'"))
                    .append("\"]\n");
            if (i > 0) {
                mermaid.append("  S").append(i).append(" --> S").append(i + 1).append('\n');
            }
        }
        return mermaid.toString();
    }

    private void notifyShared(Diagram diagram, User actor) {
        Map<Long, User> recipients = new LinkedHashMap<>();
        User manager = diagram.getProject().getManager();
        if (manager != null) {
            recipients.put(manager.getId(), manager);
        }
        taskRepository.findDistinctAssigneesByProjectId(diagram.getProject().getId()).forEach(user -> recipients.put(user.getId(), user));
        recipients.remove(actor.getId());

        String message = "Diagramme partage: " + diagram.getTitre();
        List<Notification> notifications = recipients.values().stream()
                .map(user -> Notification.builder()
                        .user(user)
                        .message(message)
                        .lu(false)
                        .dateCreation(LocalDateTime.now())
                        .build())
                .toList();
        if (!notifications.isEmpty()) {
            notificationRepository.saveAll(notifications);
        }
    }
}
