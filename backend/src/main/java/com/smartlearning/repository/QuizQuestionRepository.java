package com.smartlearning.repository;

import com.smartlearning.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {
    List<QuizQuestion> findByQuizId(Long quizId);
    void deleteByQuizId(Long quizId);

    /** Tổng số câu hỏi đã được sinh ra từ TẤT CẢ quiz của 1 tài liệu — dùng cho trang quản lý admin. */
    @Query("SELECT COUNT(qq) FROM QuizQuestion qq WHERE qq.quizId IN " +
            "(SELECT q.id FROM Quiz q WHERE q.documentId = :documentId)")
    long countByDocumentId(@Param("documentId") Long documentId);
}
