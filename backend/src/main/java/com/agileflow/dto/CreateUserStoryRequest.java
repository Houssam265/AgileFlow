package com.agileflow.dto;

import com.agileflow.entity.UserStory;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserStoryRequest(
        @NotBlank(message = "Le titre de la user story est obligatoire.")
        @Size(max = 160, message = "Le titre ne doit pas depasser 160 caracteres.")
        String title,

        @Size(max = 5000, message = "La description ne doit pas depasser 5000 caracteres.")
        String description,

        @NotNull(message = "La priorite est obligatoire.")
        UserStory.Priority priority,

        @Min(value = 1, message = "Les story points doivent etre superieurs a 0.")
        @Max(value = 100, message = "Les story points ne doivent pas depasser 100.")
        Integer storyPoints,

        @Size(max = 5000, message = "Les criteres d'acceptation ne doivent pas depasser 5000 caracteres.")
        String acceptanceCriteria
) {
}
