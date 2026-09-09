package com.smartlearning.controller;

import com.smartlearning.config.JwtAuthFilter.AuthenticatedUser;
import com.smartlearning.dto.DocumentDto;
import com.smartlearning.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<DocumentDto> upload(@AuthenticationPrincipal AuthenticatedUser user,
                                               @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(documentService.upload(user.id(), file));
    }

    @GetMapping
    public ResponseEntity<List<DocumentDto>> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(documentService.listForUser(user.id()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
        documentService.delete(user.id(), id);
        return ResponseEntity.noContent().build();
    }
}
