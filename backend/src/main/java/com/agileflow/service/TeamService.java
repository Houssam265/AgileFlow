package com.agileflow.service;

import com.agileflow.dto.*;
import com.agileflow.entity.Team;
import com.agileflow.entity.TeamMember;
import com.agileflow.entity.User;
import com.agileflow.exception.BadRequestException;
import com.agileflow.exception.ConflictException;
import com.agileflow.exception.ForbiddenOperationException;
import com.agileflow.exception.ResourceNotFoundException;
import com.agileflow.repository.TeamMemberRepository;
import com.agileflow.repository.TeamRepository;
import com.agileflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur courant introuvable"));
    }

    private boolean isAdmin(User u) {
        return u.getRole() == User.Role.ROLE_ADMIN;
    }

    private boolean canManageTeam(User actor, Team team) {
        return isAdmin(actor)
                || (actor.getRole() == User.Role.ROLE_MANAGER && team.getManager().getId().equals(actor.getId()));
    }

    @Transactional(readOnly = true)
    public List<TeamDTO> listTeams(String q) {
        String query = (q == null || q.isBlank()) ? null : q.trim();
        return teamRepository.search(query).stream().map(this::toTeamDTO).toList();
    }

    private TeamDTO toTeamDTO(Team t) {
        long count = teamMemberRepository.countByTeam_Id(t.getId());
        User m = t.getManager();
        String managerName = (m.getPrenom() + " " + m.getNom()).trim();
        return new TeamDTO(
                t.getId(),
                t.getName(),
                t.getDescription(),
                m.getId(),
                managerName,
                count,
                t.getCreatedAt() != null ? t.getCreatedAt().toString() : null
        );
    }

    @Transactional(readOnly = true)
    public TeamWithMembersDTO getTeamById(Long id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Équipe introuvable"));
        User mgr = team.getManager();
        List<TeamMemberEntryDTO> members = teamMemberRepository.findByTeam_IdOrderByJoinedAtAsc(id).stream()
                .map(tm -> new TeamMemberEntryDTO(
                        UserService.toUserDTO(tm.getUser()),
                        tm.getJoinedAt() != null ? tm.getJoinedAt().toString() : null
                ))
                .toList();
        return new TeamWithMembersDTO(
                team.getId(),
                team.getName(),
                team.getDescription(),
                team.getCreatedAt() != null ? team.getCreatedAt().toString() : null,
                UserService.toUserDTO(mgr),
                members
        );
    }

    @Transactional
    public TeamDTO createTeam(CreateTeamRequest request) {
        User actor = currentUser();
        if (!isAdmin(actor) && actor.getRole() != User.Role.ROLE_MANAGER) {
            throw new ForbiddenOperationException("Seuls les administrateurs et managers peuvent créer une équipe.");
        }
        User manager = userRepository.findById(request.managerId())
                .orElseThrow(() -> new ResourceNotFoundException("Manager introuvable"));
        if (manager.getRole() != User.Role.ROLE_ADMIN && manager.getRole() != User.Role.ROLE_MANAGER) {
            throw new BadRequestException("Le manager doit avoir le rôle ADMIN ou MANAGER.");
        }
        Team team = Team.builder()
                .name(request.name())
                .description(request.description())
                .manager(manager)
                .build();
        teamRepository.save(team);
        return toTeamDTO(team);
    }

    @Transactional
    public TeamDTO updateTeam(Long id, UpdateTeamRequest request) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Équipe introuvable"));
        User actor = currentUser();
        if (!canManageTeam(actor, team)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas modifier cette équipe.");
        }
        team.setName(request.name());
        team.setDescription(request.description());
        teamRepository.save(team);
        return toTeamDTO(team);
    }

    @Transactional
    public void deleteTeam(Long id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Équipe introuvable"));
        User actor = currentUser();
        if (!canManageTeam(actor, team)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas supprimer cette équipe.");
        }
        List<TeamMember> members = teamMemberRepository.findByTeam_IdOrderByJoinedAtAsc(id);
        teamMemberRepository.deleteAll(members);
        teamRepository.delete(team);
    }

    @Transactional
    public void addMember(Long teamId, Long userId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Équipe introuvable"));
        User actor = currentUser();
        if (!canManageTeam(actor, team)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas gérer les membres de cette équipe.");
        }
        if (teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, userId)) {
            throw new ConflictException("L'utilisateur est déjà membre de cette équipe.");
        }
        User member = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        if (member.getRole() != User.Role.ROLE_DEVELOPER) {
            throw new BadRequestException("Seuls les utilisateurs avec le rôle DEVELOPER peuvent être ajoutés à une équipe.");
        }
        TeamMember tm = TeamMember.builder()
                .team(team)
                .user(member)
                .build();
        teamMemberRepository.save(tm);
    }

    @Transactional
    public void removeMember(Long teamId, Long userId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Équipe introuvable"));
        User actor = currentUser();
        if (!canManageTeam(actor, team)) {
            throw new ForbiddenOperationException("Vous ne pouvez pas gérer les membres de cette équipe.");
        }
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, userId)) {
            throw new ResourceNotFoundException("Membre introuvable dans cette équipe.");
        }
        teamMemberRepository.deleteByTeam_IdAndUser_Id(teamId, userId);
    }
}
