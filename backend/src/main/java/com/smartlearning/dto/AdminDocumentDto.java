package com.smartlearning.dto;

import com.smartlearning.entity.DocumentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Góc nhìn của ADMIN về 1 tài liệu — chỉ metadata quản lý (chủ sở hữu,
 * trạng thái, số quiz/câu hỏi phát sinh). KHÔNG bao giờ chứa nội dung
 * trích xuất từ PDF, để đảm bảo admin không đọc được nội dung tài liệu
 * của người dùng.
 */
@Data
@AllArgsConstructor
public class AdminDocumentDto {
    private Long id;
    private String filename;
    private DocumentStatus status;
    private Integer pageCount;
    private LocalDateTime createdAt;

    private Long ownerId;
    private String ownerName;
    private String ownerEmail;

    private int quizCount;
    private int questionCount;
}
