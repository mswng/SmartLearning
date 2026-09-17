package com.smartlearning.repository;

import com.smartlearning.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Quiz> findByDocumentId(Long documentId);
}
