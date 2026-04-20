package com.agileflow.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserDTO(
        Long id,
        String email,
        String firstName,
        String lastName,
        String role,
        String createdAt,
        Boolean active,
        String lastLogin
) {}
