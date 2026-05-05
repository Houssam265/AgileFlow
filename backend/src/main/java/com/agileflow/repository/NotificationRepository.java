package com.agileflow.repository;

import com.agileflow.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUser_IdOrderByDateCreationDesc(Long userId);
    
    Page<Notification> findByUser_IdOrderByDateCreationDesc(Long userId, Pageable pageable);
}
