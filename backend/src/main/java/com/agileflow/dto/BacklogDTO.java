package com.agileflow.dto;

import java.util.List;

public record BacklogDTO(
        Long id,
        Long projectId,
        String projectName,
        List<UserStoryDTO> stories
) {
}
