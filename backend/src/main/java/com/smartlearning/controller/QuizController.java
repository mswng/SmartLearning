package com.smartlearning.controller;

import com.smartlearning.config.JwtAuthFilter.AuthenticatedUser;
import com.smartlearning.dto.QuizDto;
import com.smartlearning.dto.QuizGenerateRequest;
import com.smartlearning.service.QuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    @PostMapping("/generate")
    public ResponseEntity<QuizDto> generate(@AuthenticationPrincipal AuthenticatedUser user,
                                             @RequestBody QuizGenerateRequest request) {
        int n = request.getNumQuestions() > 0 ? request.getNumQuestions() : 5;
        return ResponseEntity.ok(quizService.generate(user.id(), request.getDocumentId(), n));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizDto> get(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
        return ResponseEntity.ok(quizService.get(user.id(), id));
    }
}
