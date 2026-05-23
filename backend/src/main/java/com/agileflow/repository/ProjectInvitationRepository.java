package com.agileflow.repository;

import com.agileflow.entity.ProjectInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectInvitationRepository extends JpaRepository<ProjectInvitation, Long> {

    Optional<ProjectInvitation> findByToken(String token);

    @Query("""
            SELECT i FROM ProjectInvitation i
            JOIN FETCH i.invitedBy
            WHERE i.project.id = :projectId
              AND i.status = com.agileflow.entity.ProjectInvitation$InvitationStatus.PENDING
            ORDER BY i.createdAt DESC
            """)
    List<ProjectInvitation> findPendingByProjectId(@Param("projectId") Long projectId);

    @Query("""
            SELECT i FROM ProjectInvitation i
            JOIN FETCH i.project
            JOIN FETCH i.invitedBy
            WHERE i.status = com.agileflow.entity.ProjectInvitation$InvitationStatus.PENDING
              AND LOWER(i.email) = LOWER(:email)
            ORDER BY i.createdAt DESC
            """)
    List<ProjectInvitation> findPendingByEmail(@Param("email") String email);

    boolean existsByProject_IdAndEmailIgnoreCaseAndStatus(Long projectId, String email, ProjectInvitation.InvitationStatus status);

    @Query("""
            SELECT CASE WHEN COUNT(i) > 0 THEN true ELSE false END
            FROM ProjectInvitation i
            WHERE i.project.id = :projectId
              AND i.status = com.agileflow.entity.ProjectInvitation$InvitationStatus.PENDING
              AND (
                    LOWER(i.email) = LOWER(:email)
                 OR (i.invitedUser IS NOT NULL AND i.invitedUser.id = :userId)
              )
            """)
    boolean existsPendingForProjectAndUser(
            @Param("projectId") Long projectId,
            @Param("email") String email,
            @Param("userId") Long userId
    );
}
