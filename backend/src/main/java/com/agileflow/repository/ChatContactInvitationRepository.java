package com.agileflow.repository;

import com.agileflow.entity.ChatContactInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatContactInvitationRepository extends JpaRepository<ChatContactInvitation, Long> {

    Optional<ChatContactInvitation> findByRequester_IdAndRecipient_Id(Long requesterId, Long recipientId);

    @Query("""
            SELECT i FROM ChatContactInvitation i
            WHERE i.status = com.agileflow.entity.ChatContactInvitation$InvitationStatus.ACCEPTED
              AND (i.requester.id = :userId OR i.recipient.id = :userId)
            ORDER BY i.respondedAt DESC, i.createdAt DESC
            """)
    List<ChatContactInvitation> findAcceptedContacts(@Param("userId") Long userId);

    @Query("""
            SELECT i FROM ChatContactInvitation i
            WHERE i.status = com.agileflow.entity.ChatContactInvitation$InvitationStatus.PENDING
              AND i.recipient.id = :userId
            ORDER BY i.createdAt DESC
            """)
    List<ChatContactInvitation> findPendingReceived(@Param("userId") Long userId);

    @Query("""
            SELECT i FROM ChatContactInvitation i
            WHERE i.status = com.agileflow.entity.ChatContactInvitation$InvitationStatus.PENDING
              AND i.requester.id = :userId
            ORDER BY i.createdAt DESC
            """)
    List<ChatContactInvitation> findPendingSent(@Param("userId") Long userId);

    @Query("""
            SELECT CASE WHEN COUNT(i) > 0 THEN true ELSE false END
            FROM ChatContactInvitation i
            WHERE i.status = com.agileflow.entity.ChatContactInvitation$InvitationStatus.ACCEPTED
              AND (
                    (i.requester.id = :userA AND i.recipient.id = :userB)
                 OR (i.requester.id = :userB AND i.recipient.id = :userA)
              )
            """)
    boolean areContacts(@Param("userA") Long userA, @Param("userB") Long userB);

    @Query("""
            SELECT i FROM ChatContactInvitation i
            WHERE i.status <> com.agileflow.entity.ChatContactInvitation$InvitationStatus.REJECTED
              AND (
                    (i.requester.id = :userA AND i.recipient.id = :userB)
                 OR (i.requester.id = :userB AND i.recipient.id = :userA)
              )
            """)
    List<ChatContactInvitation> findActiveBetween(@Param("userA") Long userA, @Param("userB") Long userB);
}
