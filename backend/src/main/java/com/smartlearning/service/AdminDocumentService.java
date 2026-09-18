package com.smartlearning.service;

import com.smartlearning.dto.AdminDocumentDto;
import com.smartlearning.entity.Document;
import com.smartlearning.entity.User;
import com.smartlearning.repository.DocumentRepository;
import com.smartlearning.repository.QuizQuestionRepository;
import com.smartlearning.repository.QuizRepository;
import com.smartlearning.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminDocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final DocumentService documentService;

    /**
     * @param userId lọc theo 1 người dùng cụ thể, hoặc null để lấy tất cả
     *               (dùng cho câu "xem tài liệu của 1 người đẩy lên là bao
     *               nhiêu" — vừa xem tổng thể vừa lọc theo người).
     */
    public List<AdminDocumentDto> listAll(Long userId) {
        List<Document> documents = userId != null
                ? documentRepository.findByUserIdOrderByCreatedAtDesc(userId)
                : documentRepository.findAll();

        List<Long> ownerIds = documents.stream().map(Document::getUserId).distinct().toList();
        Map<Long, User> ownersById = userRepository.findAllById(ownerIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return documents.stream()
                .map(d -> toDto(d, ownersById.get(d.getUserId())))
                .toList();
    }

    /** Admin xóa tài liệu (kiểm duyệt) — không kiểm tra chủ sở hữu, không đọc nội dung. */
    public void delete(Long documentId) {
        documentService.adminDelete(documentId);
    }

    private AdminDocumentDto toDto(Document d, User owner) {
        int quizCount = quizRepository.findByDocumentId(d.getId()).size();
        int questionCount = (int) quizQuestionRepository.countByDocumentId(d.getId());

        return new AdminDocumentDto(
                d.getId(),
                d.getFilename(),
                d.getStatus(),
                d.getPageCount(),
                d.getCreatedAt(),
                d.getUserId(),
                owner != null ? owner.getName() : "(đã xóa)",
                owner != null ? owner.getEmail() : "-",
                quizCount,
                questionCount
        );
    }
}
