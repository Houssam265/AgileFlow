package com.agileflow.service;

import com.agileflow.dto.CreateEpicRequest;
import com.agileflow.dto.EpicDTO;
import com.agileflow.dto.UpdateEpicRequest;
import com.agileflow.entity.Epic;
import com.agileflow.entity.Project;
import com.agileflow.entity.Task;
import com.agileflow.entity.User;
import com.agileflow.entity.UserStory;
import com.agileflow.repository.TaskRepository;
import com.agileflow.exception.ForbiddenOperationException;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.EpicRepository;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.UserStoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EpicService {

    private final EpicRepository epicRepository;
    private final ProjectRepository projectRepository;
    private final UserStoryRepository userStoryRepository;
    private final TaskRepository taskRepository;
    private final ProjectAccessService projectAccessService;

    @Transactional(readOnly = true)
    public List<EpicDTO> listByProject(Long projectId) {
        User actor = projectAccessService.currentUser();
        Project project = getProjectOrThrow(projectId);
        projectAccessService.assertProjectAccess(actor, project);
        return epicRepository.findByProjectIdOrderBySortOrder(projectId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public EpicDTO create(Long projectId, CreateEpicRequest request) {
        User actor = projectAccessService.currentUser();
        Project project = getProjectOrThrow(projectId);
        projectAccessService.assertCanManageProject(actor, project);

        int nextOrder = epicRepository.findByProjectIdOrderBySortOrder(projectId).size();
        Epic epic = Epic.builder()
                .titre(request.title())
                .description(request.description())
                .statut(request.status() != null ? request.status() : Epic.EpicStatus.TODO)
                .color(request.color() != null ? request.color() : "#6366F1")
                .sortOrder(nextOrder)
                .dateDebut(request.startDate())
                .dateFin(request.endDate())
                .project(project)
                .build();
        return toDto(epicRepository.save(epic));
    }

    @Transactional
    public EpicDTO update(Long epicId, UpdateEpicRequest request) {
        User actor = projectAccessService.currentUser();
        Epic epic = getEpicOrThrow(epicId);
        projectAccessService.assertCanManageProject(actor, epic.getProject());

        epic.setTitre(request.title());
        epic.setDescription(request.description());
        if (request.status() != null) {
            epic.setStatut(request.status());
        }
        if (request.color() != null) {
            epic.setColor(request.color());
        }
        if (request.sortOrder() != null) {
            epic.setSortOrder(request.sortOrder());
        }
        epic.setDateDebut(request.startDate());
        epic.setDateFin(request.endDate());
        return toDto(epicRepository.save(epic));
    }

    @Transactional
    public void delete(Long epicId) {
        User actor = projectAccessService.currentUser();
        Epic epic = getEpicOrThrow(epicId);
        projectAccessService.assertCanManageProject(actor, epic.getProject());
        userStoryRepository.findByEpic_Id(epicId).forEach(story -> story.setEpic(null));
        epicRepository.delete(epic);
    }

    Epic getEpicOrThrow(Long epicId) {
        return epicRepository.findById(epicId)
                .orElseThrow(() -> new ResourceNotFoundException("Epic introuvable"));
    }

    Epic resolveEpicForProject(Long epicId, Project project) {
        if (epicId == null) {
            return null;
        }
        Epic epic = getEpicOrThrow(epicId);
        if (!epic.getProject().getId().equals(project.getId())) {
            throw new ForbiddenOperationException("Cet epic n'appartient pas au projet.");
        }
        return epic;
    }

    private Project getProjectOrThrow(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet introuvable"));
    }

    private EpicDTO toDto(Epic epic) {
        List<UserStory> stories = userStoryRepository.findByEpic_Id(epic.getId());
        long planned = stories.stream().filter(s -> s.getSprint() != null).count();
        long doneStories = stories.stream().filter(this::isStoryDone).count();
        long totalTasks = 0;
        long completedTasks = 0;
        for (UserStory story : stories) {
            totalTasks += taskRepository.countByStory_Id(story.getId());
            completedTasks += taskRepository.countByStory_IdAndStatut(story.getId(), Task.Statut.DONE);
        }
        int points = stories.stream()
                .map(UserStory::getStoryPoints)
                .filter(p -> p != null)
                .mapToInt(Integer::intValue)
                .sum();
        int progressPercent = stories.isEmpty()
                ? (epic.getStatut() == Epic.EpicStatus.DONE ? 100 : 0)
                : (int) Math.round((doneStories * 100.0) / stories.size());
        return new EpicDTO(
                epic.getId(),
                epic.getProject().getId(),
                epic.getTitre(),
                epic.getDescription(),
                epic.getStatut(),
                epic.getColor(),
                epic.getSortOrder(),
                epic.getDateDebut() != null ? epic.getDateDebut().toString() : null,
                epic.getDateFin() != null ? epic.getDateFin().toString() : null,
                stories.size(),
                planned,
                doneStories,
                planned,
                totalTasks,
                completedTasks,
                points,
                progressPercent
        );
    }

    private boolean isStoryDone(UserStory story) {
        long taskCount = taskRepository.countByStory_Id(story.getId());
        if (taskCount == 0) {
            return false;
        }
        return taskRepository.countByStory_IdAndStatut(story.getId(), Task.Statut.DONE) == taskCount;
    }
}
