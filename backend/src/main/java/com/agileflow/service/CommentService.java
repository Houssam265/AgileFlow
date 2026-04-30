package com.agileflow.service;

import com.agileflow.dto.CommentDTO;
import com.agileflow.dto.CreateCommentRequest;
import com.agileflow.dto.UserDTO;
import com.agileflow.entity.Comment;
import com.agileflow.entity.CommentMention;
import com.agileflow.entity.Project;
import com.agileflow.entity.Task;
import com.agileflow.entity.TeamMember;
import com.agileflow.entity.User;
import com.agileflow.exception.ForbiddenOperationException;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.CommentRepository;
import com.agileflow.repository.TaskRepository;
import com.agileflow.repository.TeamMemberRepository;
import com.agileflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final MentionParser mentionParser;
    private final MentionNotificationService mentionNotificationService;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur courant introuvable"));
    }

    private boolean isAdmin(User user) {
        return user.getRole() == User.Role.ROLE_ADMIN;
    }

    private boolean canViewProject(User actor, Project project) {
        return project != null && (
                isAdmin(actor)
                        || actor.getRole() == User.Role.ROLE_DEVELOPER
                        || (actor.getRole() == User.Role.ROLE_MANAGER
                        && project.getManager() != null
                        && project.getManager().getId().equals(actor.getId()))
        );
    }

    private Task getTaskOrThrow(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Tache introuvable"));
    }

    private Project resolveProject(Task task) {
        if (task.getSprint() != null) {
            return task.getSprint().getProject();
        }
        if (task.getStory() != null && task.getStory().getBacklog() != null) {
            return task.getStory().getBacklog().getProject();
        }
        return null;
    }

    private CommentDTO toDto(Comment comment) {
        User author = comment.getAuteur();
        UserDTO auteur = UserService.toUserDTO(author);
        List<String> mentions = comment.getMentions().stream()
                .map(CommentMention::getMentionKey)
                .distinct()
                .toList();
        return new CommentDTO(
                comment.getId(),
                comment.getContenu(),
                auteur,
                comment.getTask().getId(),
                mentions,
                comment.getCreatedAt() != null ? comment.getCreatedAt().toString() : null
        );
    }

    private Map<String, User> buildMentionableUsers(Project project) {
        Map<String, User> mentionableUsers = new LinkedHashMap<>();
        if (project == null || project.getTeam() == null) {
            return mentionableUsers;
        }

        List<TeamMember> members = teamMemberRepository.findByTeam_IdOrderByJoinedAtAsc(project.getTeam().getId());
        for (TeamMember member : members) {
            User user = member.getUser();
            mentionableUsers.put(mentionParser.buildMentionKey(user), user);
        }
        return mentionableUsers;
    }

    @Transactional(readOnly = true)
    public List<CommentDTO> getCommentsByTask(Long taskId) {
        User actor = currentUser();
        Task task = getTaskOrThrow(taskId);
        Project project = resolveProject(task);
        if (!canViewProject(actor, project)) {
            throw new ForbiddenOperationException("Vous n'avez pas acces a cette tache");
        }
        return commentRepository.findByTask_IdOrderByCreatedAtAsc(taskId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public CommentDTO createComment(Long taskId, CreateCommentRequest request) {
        User actor = currentUser();
        Task task = getTaskOrThrow(taskId);
        Project project = resolveProject(task);
        if (!canViewProject(actor, project)) {
            throw new ForbiddenOperationException("Vous n'avez pas acces a cette tache");
        }

        Comment comment = Comment.builder()
                .contenu(request.contenu().trim())
                .task(task)
                .auteur(actor)
                .build();

        Map<String, User> mentionableUsers = buildMentionableUsers(project);
        Set<User> mentionedUsers = new LinkedHashSet<>();
        for (String mentionKey : mentionParser.extractMentions(comment.getContenu())) {
            User mentionedUser = mentionableUsers.get(mentionKey);
            if (mentionedUser == null || mentionedUser.getId().equals(actor.getId())) {
                continue;
            }
            CommentMention mention = CommentMention.builder()
                    .comment(comment)
                    .user(mentionedUser)
                    .mentionKey(mentionKey)
                    .build();
            comment.getMentions().add(mention);
            mentionedUsers.add(mentionedUser);
        }

        Comment saved = commentRepository.save(comment);
        mentionNotificationService.notifyMentionedUsers(saved, mentionedUsers);
        return toDto(saved);
    }
}
