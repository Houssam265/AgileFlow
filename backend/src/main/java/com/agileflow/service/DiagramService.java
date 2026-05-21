package com.agileflow.service;

import com.agileflow.dto.CreateDiagramRequest;
import com.agileflow.dto.DiagramDTO;
import com.agileflow.dto.DiagramEdgeDTO;
import com.agileflow.dto.DiagramNodeDTO;
import com.agileflow.dto.DiagramUpdateMessage;
import com.agileflow.dto.UpdateDiagramRequest;
import com.agileflow.entity.Diagram;
import com.agileflow.entity.DiagramCollaborator;
import com.agileflow.entity.DiagramEdge;
import com.agileflow.entity.DiagramNode;
import com.agileflow.entity.Project;
import com.agileflow.entity.Task;
import com.agileflow.entity.Team;
import com.agileflow.entity.User;
import com.agileflow.exception.BadRequestException;
import com.agileflow.exception.ForbiddenOperationException;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.DiagramCollaboratorRepository;
import com.agileflow.repository.DiagramEdgeRepository;
import com.agileflow.repository.DiagramNodeRepository;
import com.agileflow.repository.DiagramRepository;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.TaskRepository;
import com.agileflow.repository.TeamMemberRepository;
import com.agileflow.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DiagramService {

    private final DiagramRepository diagramRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final DiagramNodeRepository diagramNodeRepository;
    private final DiagramEdgeRepository diagramEdgeRepository;
    private final DiagramCollaboratorRepository collaboratorRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final NotificationService notificationService;
    private final DiagramNotificationService diagramNotificationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur courant introuvable"));
    }

    private User userOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
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
    public List<DiagramDTO> getDiagramsByProject(Long projectId) {
        User actor = currentUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"));
        if (!canViewProject(actor, project)) {
            throw new ForbiddenOperationException("Vous n'avez pas acces a ce projet.");
        }
        return diagramRepository.findVisible(projectId, isAdmin(actor) ? null : actor.getId()).stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DiagramDTO> getDiagramsByTask(Long taskId) {
        User actor = currentUser();
        return diagramRepository.findByTaskId(taskId).stream()
                .filter(diagram -> canView(actor, diagram))
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

    @Transactional(readOnly = true)
    public DiagramDTO getDiagram(Long id, Long userId) {
        Diagram diagram = findDiagram(id);
        User actor = userOrThrow(userId);
        if (!canView(actor, diagram)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas consulter ce diagramme.");
        }
        return toDTO(diagram);
    }

    @Transactional
    public DiagramDTO createDiagram(CreateDiagramRequest request) {
        return createDiagramForActor(request, currentUser());
    }

    @Transactional
    public DiagramDTO createDiagram(CreateDiagramRequest request, Long userId) {
        return createDiagramForActor(request, userOrThrow(userId));
    }

    private DiagramDTO createDiagramForActor(CreateDiagramRequest request, User actor) {
        Project project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"));
        if (!canCreateInProject(actor, project)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas creer un diagramme dans ce projet.");
        }

        Task task = resolveTask(request.taskId(), project);
        List<String> steps = cleanSteps(request.etapes());
        String title = requireTitle(request.effectiveTitle());
        Diagram.Type type = request.type() != null ? request.type() : Diagram.Type.CUSTOM;
        String canvasData = resolveCanvasData(title, type, steps, request.effectiveCanvasData(), request.nodes(), request.edges());
        String legacyJson = resolveLegacyJson(title, type, steps, request.json(), null);

        Diagram diagram = Diagram.builder()
                .title(title)
                .titre(title)
                .description(request.description())
                .type(type)
                .project(project)
                .owner(actor)
                .createdBy(actor)
                .task(task)
                .etapesJson(writeSteps(steps))
                .json(legacyJson)
                .canvasData(canvasData)
                .shared(request.effectiveShared())
                .isShared(request.effectiveShared())
                .thumbnailUrl(request.thumbnailUrl())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        diagramRepository.save(diagram);
        replaceNodesAndEdges(diagram, request.nodes(), request.edges());

        DiagramDTO diagramDTO = toDTO(findDiagram(diagram.getId()));
        String actorName = displayName(actor);
        diagramNotificationService.notifyDiagramCreated(project.getId(), diagramDTO, actorName);

        if (diagram.isEffectivelyShared()) {
            notifyShared(diagram, actor);
            diagramNotificationService.notifyDiagramShared(project.getId(), diagramDTO, actorName);
        }

        return diagramDTO;
    }

    @Transactional
    public DiagramDTO updateDiagram(Long id, UpdateDiagramRequest request) {
        return saveDiagramForActor(id, request, currentUser());
    }

    @Transactional
    public DiagramDTO saveDiagram(Long id, DiagramDTO dto) {
        return saveDiagramForActor(id, toUpdateRequest(dto), currentUser());
    }

    @Transactional
    public DiagramDTO saveDiagram(Long id, DiagramDTO dto, Long userId) {
        return saveDiagram(id, toUpdateRequest(dto), userId);
    }

    private UpdateDiagramRequest toUpdateRequest(DiagramDTO dto) {
        return new UpdateDiagramRequest(
                dto.titre(),
                dto.title(),
                dto.description(),
                dto.type(),
                dto.etapes(),
                dto.json(),
                dto.canvasData(),
                dto.content(),
                dto.thumbnailUrl(),
                dto.shared(),
                dto.isShared(),
                dto.taskId(),
                dto.nodes(),
                dto.edges()
        );
    }

    @Transactional
    public DiagramDTO saveDiagram(Long id, UpdateDiagramRequest request, Long userId) {
        return saveDiagramForActor(id, request, userOrThrow(userId));
    }

    @Transactional
    public DiagramDTO updateContent(Long id, String content) {
        Diagram diagram = findDiagram(id);
        User actor = currentUser();
        if (!canEdit(actor, diagram)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas modifier ce diagramme.");
        }
        String resolvedContent = StringUtils.hasText(content)
                ? content.trim()
                : writeCanvasData(diagram.getDisplayTitle(), diagram.getType(), List.of(), List.of());
        diagram.setCanvasData(resolvedContent);
        diagramRepository.save(diagram);
        return toDTO(findDiagram(id));
    }

    private DiagramDTO saveDiagramForActor(Long id, UpdateDiagramRequest request, User actor) {
        Diagram diagram = findDiagram(id);
        if (!canEdit(actor, diagram)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas modifier ce diagramme.");
        }
        boolean becameShared = !diagram.isEffectivelyShared() && request.effectiveShared();
        List<String> steps = cleanSteps(request.etapes());
        String title = requireTitle(request.effectiveTitle());
        Diagram.Type type = request.type() != null ? request.type() : diagram.getType();
        String canvasData = resolveCanvasData(title, type, steps, request.effectiveCanvasData(), request.nodes(), request.edges());
        String legacyJson = resolveLegacyJson(title, type, steps, request.json(), diagram.getJson());

        diagram.setTitle(title);
        diagram.setDescription(request.description());
        diagram.setType(type);
        diagram.setEtapesJson(writeSteps(steps));
        diagram.setJson(legacyJson);
        diagram.setCanvasData(canvasData);
        diagram.setShared(request.effectiveShared());
        diagram.setThumbnailUrl(request.thumbnailUrl());
        if (request.taskId() != null) {
            diagram.setTask(resolveTask(request.taskId(), diagram.getProject()));
        }
        diagramRepository.save(diagram);
        replaceNodesAndEdges(diagram, request.nodes(), request.edges());

        DiagramDTO diagramDTO = toDTO(findDiagram(id));
        if (becameShared) {
            String actorName = displayName(actor);
            notifyShared(diagram, actor);
            diagramNotificationService.notifyDiagramShared(diagram.getProject().getId(), diagramDTO, actorName);
        }

        return diagramDTO;
    }

    @Transactional
    public void patchNode(Long diagramId, DiagramNodeDTO node) {
        Diagram diagram = findDiagram(diagramId);
        DiagramNode entity = toNode(node, diagram);
        diagramNodeRepository.save(entity);
        refreshCanvasData(diagram);
    }

    @Transactional
    public void patchEdge(Long diagramId, DiagramEdgeDTO edge) {
        Diagram diagram = findDiagram(diagramId);
        DiagramEdge entity = toEdge(edge, diagram);
        diagramEdgeRepository.save(entity);
        refreshCanvasData(diagram);
    }

    @Transactional
    public void deleteNode(Long diagramId, String nodeId) {
        Diagram diagram = findDiagram(diagramId);
        diagramNodeRepository.deleteById(nodeId);
        refreshCanvasData(diagram);
    }

    @Transactional
    public void deleteEdge(Long diagramId, String edgeId) {
        Diagram diagram = findDiagram(diagramId);
        diagramEdgeRepository.deleteById(edgeId);
        refreshCanvasData(diagram);
    }

    @Async
    @Transactional
    public void persistRealtimeUpdate(DiagramUpdateMessage message) {
        if (message == null || message.type() == null || message.diagramId() == null) {
            return;
        }
        try {
            switch (message.type()) {
                case NODE_ADDED, NODE_MOVED, NODE_UPDATED -> patchNode(message.diagramId(), objectMapper.convertValue(message.payload(), DiagramNodeDTO.class));
                case NODE_DELETED -> deleteNode(message.diagramId(), String.valueOf(message.payload()));
                case EDGE_ADDED, EDGE_UPDATED -> patchEdge(message.diagramId(), objectMapper.convertValue(message.payload(), DiagramEdgeDTO.class));
                case EDGE_DELETED -> deleteEdge(message.diagramId(), String.valueOf(message.payload()));
                case CONTENT_UPDATE, FULL_SYNC -> applyContentPayload(message.diagramId(), message.payload());
                default -> {
                    // Presence, cursor and selection events are broadcast only.
                }
            }
        } catch (RuntimeException ignored) {
            // WebSocket broadcasts must stay responsive; REST save remains the source of truth.
        }
    }

    @Transactional
    public void applyContentPayload(Long diagramId, Object payload) {
        Diagram diagram = findDiagram(diagramId);
        Map<String, Object> content = objectMapper.convertValue(payload, new TypeReference<>() {
        });
        List<DiagramNodeDTO> nodes = objectMapper.convertValue(content.getOrDefault("nodes", List.of()), new TypeReference<List<DiagramNodeDTO>>() {
        });
        List<DiagramEdgeDTO> edges = objectMapper.convertValue(content.getOrDefault("edges", List.of()), new TypeReference<List<DiagramEdgeDTO>>() {
        });
        replaceNodesAndEdges(diagram, nodes, edges);
        diagram.setCanvasData(writeCanvasData(diagram.getDisplayTitle(), diagram.getType(), nodes, edges));
        diagramRepository.save(diagram);
    }

    @Transactional
    public void deleteDiagram(Long id) {
        deleteDiagramForActor(id, currentUser());
    }

    @Transactional
    public void deleteDiagram(Long id, Long userId) {
        deleteDiagramForActor(id, userOrThrow(userId));
    }

    private void deleteDiagramForActor(Long id, User actor) {
        Diagram diagram = findDiagram(id);
        if (!canEdit(actor, diagram)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas supprimer ce diagramme.");
        }
        diagramRepository.delete(diagram);
    }

    @Transactional
    public void addCollaborator(Long diagramId, Long userId, DiagramCollaborator.Permission permission) {
        Diagram diagram = findDiagram(diagramId);
        User actor = currentUser();
        if (!canManageCollaborators(actor, diagram)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas gerer les collaborateurs de ce diagramme.");
        }
        User collaborator = userOrThrow(userId);
        DiagramCollaborator entity = collaboratorRepository.findByDiagramIdAndUserId(diagramId, userId)
                .orElseGet(() -> DiagramCollaborator.builder()
                        .diagram(diagram)
                        .user(collaborator)
                        .addedAt(LocalDateTime.now())
                        .build());
        entity.setPermission(permission != null ? permission : DiagramCollaborator.Permission.VIEW);
        collaboratorRepository.save(entity);
    }

    @Transactional
    public void removeCollaborator(Long diagramId, Long userId) {
        Diagram diagram = findDiagram(diagramId);
        User actor = currentUser();
        if (!canManageCollaborators(actor, diagram)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas gerer les collaborateurs de ce diagramme.");
        }
        collaboratorRepository.deleteByDiagramIdAndUserId(diagramId, userId);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCollaborators(Long diagramId) {
        Diagram diagram = findDiagram(diagramId);
        User actor = currentUser();
        if (!canView(actor, diagram)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas consulter ce diagramme.");
        }
        return collaboratorRepository.findByDiagramId(diagramId).stream()
                .map(collaborator -> {
                    User user = collaborator.getUser();
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("userId", user.getId());
                    row.put("username", displayName(user));
                    row.put("email", user.getEmail());
                    row.put("permission", collaborator.getPermission().name());
                    row.put("color", userColor(user.getId()));
                    row.put("cursorX", 0);
                    row.put("cursorY", 0);
                    row.put("isActive", false);
                    return row;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public byte[] exportDiagram(Long id, String format) {
        Diagram diagram = findDiagram(id);
        User actor = currentUser();
        if (!canView(actor, diagram)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas exporter ce diagramme.");
        }
        String extension = StringUtils.hasText(format) ? format.toLowerCase() : "json";
        if ("svg".equals(extension)) {
            String svg = """
                    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="600">
                      <rect width="100%%" height="100%%" fill="#ffffff"/>
                      <text x="32" y="48" fill="#0f172a" font-size="24" font-family="Arial">%s</text>
                      <text x="32" y="86" fill="#475569" font-size="14" font-family="Arial">%s</text>
                    </svg>
                    """.formatted(escapeXml(diagram.getDisplayTitle()), escapeXml(diagram.getCanvasData()));
            return svg.getBytes(StandardCharsets.UTF_8);
        }
        return Optional.ofNullable(diagram.getCanvasData()).orElse("{}").getBytes(StandardCharsets.UTF_8);
    }

    private Diagram findDiagram(Long id) {
        return diagramRepository.findWithRelationsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Diagramme introuvable"));
    }

    private boolean isAdmin(User user) {
        return user.getRole() == User.Role.ROLE_ADMIN;
    }

    private boolean canCreateInProject(User actor, Project project) {
        return canViewProject(actor, project);
    }

    private boolean canView(User actor, Diagram diagram) {
        return isAdmin(actor)
                || diagram.isEffectivelyShared()
                || sameUser(actor, diagram.getEffectiveOwner())
                || isProjectManager(actor, diagram.getProject())
                || collaboratorRepository.existsByDiagramIdAndUserId(diagram.getId(), actor.getId())
                || canViewProject(actor, diagram.getProject());
    }

    private boolean canEdit(User actor, Diagram diagram) {
        if (isAdmin(actor) || sameUser(actor, diagram.getEffectiveOwner()) || isProjectManager(actor, diagram.getProject())) {
            return true;
        }
        return collaboratorRepository.findByDiagramIdAndUserId(diagram.getId(), actor.getId())
                .map(collaborator -> collaborator.getPermission() == DiagramCollaborator.Permission.EDIT)
                .orElse(false);
    }

    private boolean canManageCollaborators(User actor, Diagram diagram) {
        return isAdmin(actor) || sameUser(actor, diagram.getEffectiveOwner());
    }

    private boolean canViewProject(User actor, Project project) {
        if (project == null) {
            return false;
        }
        if (isAdmin(actor) || isProjectManager(actor, project)) {
            return true;
        }
        Team team = project.getTeam();
        return team != null && teamMemberRepository.findByTeam_IdAndUser_Id(team.getId(), actor.getId()).isPresent();
    }

    private boolean isProjectManager(User actor, Project project) {
        return project != null
                && project.getManager() != null
                && project.getManager().getId().equals(actor.getId());
    }

    private boolean sameUser(User left, User right) {
        return left != null && right != null && left.getId() != null && left.getId().equals(right.getId());
    }

    private Task resolveTask(Long taskId, Project project) {
        if (taskId == null) {
            return null;
        }
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Tache introuvable"));
        Project taskProject = task.getSprint() != null ? task.getSprint().getProject()
                : task.getStory() != null ? task.getStory().getBacklog().getProject()
                : null;
        if (taskProject != null && project != null && !taskProject.getId().equals(project.getId())) {
            throw new BadRequestException("La tache cible n'appartient pas au projet du diagramme.");
        }
        return task;
    }

    private DiagramDTO toDTO(Diagram diagram) {
        Project project = diagram.getProject();
        User owner = diagram.getEffectiveOwner();
        Task task = diagram.getTask();
        List<DiagramNodeDTO> nodes = diagramNodeRepository.findAllByDiagramId(diagram.getId()).stream()
                .sorted(Comparator.comparing(node -> Optional.ofNullable(node.getZIndex()).orElse(0)))
                .map(this::toNodeDTO)
                .toList();
        List<DiagramEdgeDTO> edges = diagramEdgeRepository.findAllByDiagramId(diagram.getId()).stream()
                .map(this::toEdgeDTO)
                .toList();
        return new DiagramDTO(
                diagram.getId(),
                diagram.getDisplayTitle(),
                diagram.getDescription(),
                diagram.getDisplayTitle(),
                diagram.getType(),
                readSteps(diagram.getEtapesJson()),
                diagram.getJson(),
                diagram.getCanvasData(),
                diagram.getCanvasData(),
                project != null ? project.getId() : null,
                project != null ? project.getNom() : null,
                owner != null ? owner.getId() : null,
                owner != null ? displayName(owner) : null,
                owner != null ? owner.getId() : null,
                owner != null ? displayName(owner) : null,
                task != null ? task.getId() : null,
                task != null ? task.getTitre() : null,
                diagram.isEffectivelyShared(),
                diagram.isEffectivelyShared(),
                diagram.getThumbnailUrl(),
                diagram.getCreatedAt() != null ? diagram.getCreatedAt().toString() : null,
                diagram.getUpdatedAt() != null ? diagram.getUpdatedAt().toString() : null,
                nodes,
                edges,
                (int) collaboratorRepository.countByDiagramId(diagram.getId())
        );
    }

    private void replaceNodesAndEdges(Diagram diagram, List<DiagramNodeDTO> nodes, List<DiagramEdgeDTO> edges) {
        diagramNodeRepository.deleteAllByDiagramId(diagram.getId());
        diagramEdgeRepository.deleteAllByDiagramId(diagram.getId());
        if (nodes != null && !nodes.isEmpty()) {
            diagramNodeRepository.saveAll(nodes.stream().map(node -> toNode(node, diagram)).toList());
        }
        if (edges != null && !edges.isEmpty()) {
            diagramEdgeRepository.saveAll(edges.stream().map(edge -> toEdge(edge, diagram)).toList());
        }
    }

    private DiagramNode toNode(DiagramNodeDTO dto, Diagram diagram) {
        if (dto == null || !StringUtils.hasText(dto.id())) {
            throw new BadRequestException("Un noeud de diagramme doit avoir un id.");
        }
        return DiagramNode.builder()
                .id(dto.id())
                .diagram(diagram)
                .type(StringUtils.hasText(dto.type()) ? dto.type() : "rectangle")
                .positionX(dto.positionX() != null ? dto.positionX() : 0d)
                .positionY(dto.positionY() != null ? dto.positionY() : 0d)
                .width(dto.width() != null ? dto.width() : 160d)
                .height(dto.height() != null ? dto.height() : 80d)
                .data(dto.data())
                .zIndex(dto.zIndex())
                .locked(Boolean.TRUE.equals(dto.locked()))
                .build();
    }

    private DiagramEdge toEdge(DiagramEdgeDTO dto, Diagram diagram) {
        if (dto == null || !StringUtils.hasText(dto.id())) {
            throw new BadRequestException("Une connexion de diagramme doit avoir un id.");
        }
        return DiagramEdge.builder()
                .id(dto.id())
                .diagram(diagram)
                .sourceNodeId(dto.sourceNodeId())
                .targetNodeId(dto.targetNodeId())
                .sourceHandle(dto.sourceHandle())
                .targetHandle(dto.targetHandle())
                .edgeType(StringUtils.hasText(dto.edgeType()) ? dto.edgeType() : "smoothstep")
                .arrowStart(dto.arrowStart())
                .arrowEnd(dto.arrowEnd())
                .data(dto.data())
                .build();
    }

    private DiagramNodeDTO toNodeDTO(DiagramNode node) {
        return new DiagramNodeDTO(
                node.getId(),
                node.getDiagram() != null ? node.getDiagram().getId() : null,
                node.getType(),
                node.getPositionX(),
                node.getPositionY(),
                node.getWidth(),
                node.getHeight(),
                node.getData(),
                node.getZIndex(),
                node.getLocked()
        );
    }

    private DiagramEdgeDTO toEdgeDTO(DiagramEdge edge) {
        return new DiagramEdgeDTO(
                edge.getId(),
                edge.getDiagram() != null ? edge.getDiagram().getId() : null,
                edge.getSourceNodeId(),
                edge.getTargetNodeId(),
                edge.getSourceHandle(),
                edge.getTargetHandle(),
                edge.getEdgeType(),
                edge.getArrowStart(),
                edge.getArrowEnd(),
                edge.getData()
        );
    }

    private String requireTitle(String title) {
        if (!StringUtils.hasText(title)) {
            throw new BadRequestException("Le titre du diagramme est obligatoire.");
        }
        return title.trim();
    }

    private List<String> cleanSteps(List<String> steps) {
        if (steps == null) {
            return new ArrayList<>();
        }
        return steps.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .toList();
    }

    private String writeSteps(List<String> steps) {
        try {
            return objectMapper.writeValueAsString(steps != null ? steps : List.of());
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Impossible de serialiser les etapes du diagramme.", e);
        }
    }

    private List<String> readSteps(String raw) {
        if (!StringUtils.hasText(raw)) {
            return List.of();
        }
        try {
            return objectMapper.readValue(raw, new TypeReference<>() {
            });
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private String resolveCanvasData(String title, Diagram.Type type, List<String> steps, String rawCanvasData, List<DiagramNodeDTO> nodes, List<DiagramEdgeDTO> edges) {
        if (StringUtils.hasText(rawCanvasData)) {
            return rawCanvasData.trim();
        }
        if ((nodes != null && !nodes.isEmpty()) || (edges != null && !edges.isEmpty())) {
            return writeCanvasData(title, type, nodes, edges);
        }
        return writeCanvasData(title, type, buildNodesFromSteps(steps), buildEdgesFromSteps(steps));
    }

    private String resolveLegacyJson(String title, Diagram.Type type, List<String> steps, String rawJson, String fallbackJson) {
        if (StringUtils.hasText(rawJson)) {
            return rawJson.trim();
        }
        if (StringUtils.hasText(fallbackJson) && cleanSteps(steps).isEmpty()) {
            return fallbackJson;
        }
        return writeLegacyJson(title, type, steps);
    }

    private String writeLegacyJson(String title, Diagram.Type type, List<String> steps) {
        try {
            List<String> cleanSteps = cleanSteps(steps);
            return objectMapper.writeValueAsString(Map.of(
                    "title", title,
                    "type", type != null ? type.name() : Diagram.Type.CUSTOM.name(),
                    "steps", cleanSteps,
                    "mermaid", buildMermaid(cleanSteps),
                    "nodes", buildNodesFromSteps(cleanSteps),
                    "edges", buildEdgesFromSteps(cleanSteps)
            ));
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Impossible de serialiser le JSON du diagramme.", e);
        }
    }

    private String buildMermaid(List<String> steps) {
        List<String> cleanSteps = cleanSteps(steps);
        if (cleanSteps.isEmpty()) {
            return "flowchart TD";
        }
        List<String> lines = new ArrayList<>();
        lines.add("flowchart TD");
        for (int i = 0; i < cleanSteps.size(); i++) {
            lines.add("  S" + (i + 1) + "[\"" + cleanSteps.get(i).replace("\"", "'") + "\"]");
            if (i > 0) {
                lines.add("  S" + i + " --> S" + (i + 1));
            }
        }
        return String.join("\n", lines);
    }

    private String writeCanvasData(String title, Diagram.Type type, List<DiagramNodeDTO> nodes, List<DiagramEdgeDTO> edges) {
        try {
            return objectMapper.writeValueAsString(Map.of(
                    "title", title,
                    "type", type != null ? type.name() : Diagram.Type.CUSTOM.name(),
                    "nodes", nodes != null ? nodes : List.of(),
                    "edges", edges != null ? edges : List.of()
            ));
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Impossible de serialiser le canvas du diagramme.", e);
        }
    }

    private List<DiagramNodeDTO> buildNodesFromSteps(List<String> steps) {
        List<String> cleanSteps = cleanSteps(steps);
        List<DiagramNodeDTO> nodes = new ArrayList<>();
        for (int i = 0; i < cleanSteps.size(); i++) {
            String data = "{\"label\":\"" + cleanSteps.get(i).replace("\"", "'") + "\"}";
            nodes.add(new DiagramNodeDTO("S" + (i + 1), null, "rectangle", (double) (i * 220), 0d, 160d, 72d, data, i, false));
        }
        return nodes;
    }

    private List<DiagramEdgeDTO> buildEdgesFromSteps(List<String> steps) {
        List<String> cleanSteps = cleanSteps(steps);
        List<DiagramEdgeDTO> edges = new ArrayList<>();
        for (int i = 1; i < cleanSteps.size(); i++) {
            edges.add(new DiagramEdgeDTO(
                    "S" + i + "-S" + (i + 1),
                    null,
                    "S" + i,
                    "S" + (i + 1),
                    null,
                    null,
                    "smoothstep",
                    "none",
                    "filled",
                    "{\"label\":\"\"}"
            ));
        }
        return edges;
    }

    private void refreshCanvasData(Diagram diagram) {
        List<DiagramNodeDTO> nodes = diagramNodeRepository.findAllByDiagramId(diagram.getId()).stream().map(this::toNodeDTO).toList();
        List<DiagramEdgeDTO> edges = diagramEdgeRepository.findAllByDiagramId(diagram.getId()).stream().map(this::toEdgeDTO).toList();
        diagram.setCanvasData(writeCanvasData(diagram.getDisplayTitle(), diagram.getType(), nodes, edges));
        diagramRepository.save(diagram);
    }

    private void notifyShared(Diagram diagram, User actor) {
        Map<Long, User> recipients = new LinkedHashMap<>();
        User manager = diagram.getProject().getManager();
        if (manager != null) {
            recipients.put(manager.getId(), manager);
        }
        taskRepository.findDistinctAssigneesByProjectId(diagram.getProject().getId()).forEach(user -> recipients.put(user.getId(), user));
        recipients.remove(actor.getId());

        String message = "Diagramme partage: " + diagram.getDisplayTitle();
        recipients.values().forEach(user -> notificationService.createAndBroadcast(user, message));
    }

    private String displayName(User user) {
        String name = ((user.getPrenom() != null ? user.getPrenom() : "") + " " + (user.getNom() != null ? user.getNom() : "")).trim();
        return StringUtils.hasText(name) ? name : user.getEmail();
    }

    private String userColor(Long userId) {
        String[] colors = {"#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"};
        int index = userId == null ? 0 : Math.floorMod(userId.intValue(), colors.length);
        return colors[index];
    }

    private String escapeXml(String value) {
        return Optional.ofNullable(value).orElse("")
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
