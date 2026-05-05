package com.agileflow.service;

import com.agileflow.dto.AdminDashboardDTO;
import com.agileflow.repository.DiagramRepository;
import com.agileflow.repository.NotificationRepository;
import com.agileflow.repository.ProjectRepository;
import com.agileflow.repository.TaskRepository;
import com.agileflow.repository.TeamRepository;
import com.agileflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TeamRepository teamRepository;
    private final DiagramRepository diagramRepository;
    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public AdminDashboardDTO getDashboard() {
        return new AdminDashboardDTO(
                userRepository.count(),
                userRepository.countByActifTrue(),
                projectRepository.count(),
                taskRepository.count(),
                teamRepository.count(),
                diagramRepository.count(),
                notificationRepository.count()
        );
    }
}
