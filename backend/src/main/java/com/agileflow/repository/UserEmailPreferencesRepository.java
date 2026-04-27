package com.agileflow.repository;

import com.agileflow.entity.UserEmailPreferences;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserEmailPreferencesRepository extends JpaRepository<UserEmailPreferences, Long> {
    Optional<UserEmailPreferences> findByUser_Id(Long userId);
}
