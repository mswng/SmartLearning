package com.smartlearning.repository;

import com.smartlearning.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Conversation> findByUserIdAndDocumentId(Long userId, Long documentId);
}
