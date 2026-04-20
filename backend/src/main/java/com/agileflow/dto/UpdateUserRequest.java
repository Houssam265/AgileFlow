package com.agileflow.dto;

import com.agileflow.entity.User;

public record UpdateUserRequest(
        String firstName,
        String lastName,
        String email,
        User.Role role,
        Boolean active,
        String password
) {}
