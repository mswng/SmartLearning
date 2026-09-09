package com.smartlearning.controller;

import com.smartlearning.config.JwtAuthFilter.AuthenticatedUser;
import com.smartlearning.dto.SearchResultDto;
import com.smartlearning.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents/{documentId}/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public ResponseEntity<List<SearchResultDto>> search(@AuthenticationPrincipal AuthenticatedUser user,
                                                          @PathVariable Long documentId,
                                                          @RequestParam String query,
                                                          @RequestParam(defaultValue = "5") int topK) {
        return ResponseEntity.ok(searchService.semanticSearch(user.id(), documentId, query, topK));
    }
}
