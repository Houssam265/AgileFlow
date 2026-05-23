package com.agileflow.controller;

import com.agileflow.dto.*;
import com.agileflow.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<UserDTO> listUsers(@RequestParam(required = false) String q) {
        return userService.listUsers(q);
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public UserDetailDTO getMyProfile() {
        return userService.getMyProfile();
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public UserDTO updateMyProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateMyProfile(request);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public UserDetailDTO getUser(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserDTO created = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public UserDTO updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        return userService.updateUser(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.softDeleteUser(id);
        return ResponseEntity.ok().build();
    }
}
