package com.agileflow.repository;

import com.agileflow.entity.CommentMention;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentMentionRepository extends JpaRepository<CommentMention, Long> {
}
