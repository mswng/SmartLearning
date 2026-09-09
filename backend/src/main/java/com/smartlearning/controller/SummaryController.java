package com.smartlearning.controller;

import com.smartlearning.config.JwtAuthFilter.AuthenticatedUser;
import com.smartlearning.dto.SummaryResponse;
import com.smartlearning.service.SummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/documents/{documentId}/summary")
@RequiredArgsConstructor
public class SummaryController {

    private final SummaryService summaryService;

    @GetMapping
    public ResponseEntity<SummaryResponse> summarize(@AuthenticationPrincipal AuthenticatedUser user,
                                                       @PathVariable Long documentId,
                                                       @RequestParam(defaultValue = "true") boolean sections) {
        return ResponseEntity.ok(summaryService.summarize(user.id(), documentId, sections));
    }
}
