package com.agileflow.repository;

import com.agileflow.entity.TeamMember;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

    boolean existsByTeam_IdAndUser_Id(Long teamId, Long userId);

    long countByTeam_Id(Long teamId);

    @EntityGraph(attributePaths = "user")
    List<TeamMember> findByTeam_IdOrderByJoinedAtAsc(Long teamId);

    @EntityGraph(attributePaths = "team")
    List<TeamMember> findByUser_Id(Long userId);

    @EntityGraph(attributePaths = {"user", "team"})
    List<TeamMember> findByTeam_Manager_Id(Long managerId);

    Optional<TeamMember> findByTeam_IdAndUser_Id(Long teamId, Long userId);

    void deleteByTeam_IdAndUser_Id(Long teamId, Long userId);
}
