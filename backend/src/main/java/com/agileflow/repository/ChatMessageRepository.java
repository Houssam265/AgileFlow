package com.agileflow.repository;

import com.agileflow.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE m.channelType = 'GLOBAL' ORDER BY m.createdAt DESC")
    Page<ChatMessage> findGlobalMessages(Pageable pageable);

    @Query("SELECT m FROM ChatMessage m WHERE m.channelType = 'PROJECT' AND m.project.id = :projectId ORDER BY m.createdAt DESC")
    Page<ChatMessage> findProjectMessages(@Param("projectId") Long projectId, Pageable pageable);

    @Query("SELECT m FROM ChatMessage m WHERE m.channelType = 'PRIVATE' AND " +
           "((m.sender.id = :userId AND m.recipient.id = :recipientId) OR " +
           "(m.sender.id = :recipientId AND m.recipient.id = :userId)) ORDER BY m.createdAt DESC")
    Page<ChatMessage> findPrivateMessages(@Param("userId") Long userId, @Param("recipientId") Long recipientId, Pageable pageable);
}
