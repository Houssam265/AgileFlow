package com.agileflow.repository;

import com.agileflow.entity.ChatPresence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatPresenceRepository extends JpaRepository<ChatPresence, Long> {

    @Query("SELECT p.userId FROM ChatPresence p WHERE p.isOnline = true AND p.status = com.agileflow.entity.ChatPresence$VisibilityStatus.LIVE")
    List<Long> findLiveUserIds();

    @Modifying
    @Query(value = "INSERT INTO chat_presence (user_id, is_online, last_seen, status) " +
                   "VALUES (:userId, :isOnline, :lastSeen, :status) " +
                   "ON DUPLICATE KEY UPDATE is_online = :isOnline, last_seen = :lastSeen, status = :status",
            nativeQuery = true)
    void upsertPresence(Long userId, boolean isOnline, LocalDateTime lastSeen, String status);
}
