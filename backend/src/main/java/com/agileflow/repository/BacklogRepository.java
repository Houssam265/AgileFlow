package com.agileflow.repository;

import com.agileflow.entity.Backlog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BacklogRepository extends JpaRepository<Backlog, Long> {
    Optional<Backlog> findByProjectId(Long projectId);
}
