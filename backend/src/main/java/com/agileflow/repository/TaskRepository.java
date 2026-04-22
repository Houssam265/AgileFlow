package com.agileflow.repository;

import com.agileflow.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByAssignedToId(Long userId);
    List<Task> findBySprintId(Long sprintId);

    long countByStatut(Task.Statut statut);

    long countByAssignedTo_Id(Long userId);

    long countByAssignedTo_IdAndStatut(Long userId, Task.Statut statut);

    long countBySprint_Project_Manager_Id(Long managerId);

    long countBySprint_Project_Manager_IdAndStatut(Long managerId, Task.Statut statut);
}
