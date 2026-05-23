package com.agileflow.repository;

import com.agileflow.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    boolean existsByProject_IdAndUser_Id(Long projectId, Long userId);

    Optional<ProjectMember> findByProject_IdAndUser_Id(Long projectId, Long userId);

    List<ProjectMember> findByProject_IdOrderByJoinedAtAsc(Long projectId);

    @Query("SELECT pm.project.id FROM ProjectMember pm WHERE pm.user.id = :userId")
    List<Long> findProjectIdsByUserId(@Param("userId") Long userId);

    void deleteByProject_IdAndUser_Id(Long projectId, Long userId);

    long countByProject_Id(Long projectId);
}
