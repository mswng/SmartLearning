package com.smartlearning.service;

import com.smartlearning.dto.DashboardStatsDto;
import com.smartlearning.repository.ConversationRepository;
import com.smartlearning.repository.DocumentRepository;
import com.smartlearning.repository.QuizRepository;
import com.smartlearning.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final ConversationRepository conversationRepository;
    private final QuizRepository quizRepository;

    public DashboardStatsDto stats() {
        return new DashboardStatsDto(
                userRepository.count(),
                documentRepository.count(),
                conversationRepository.count(),
                quizRepository.count()
        );
    }
}
