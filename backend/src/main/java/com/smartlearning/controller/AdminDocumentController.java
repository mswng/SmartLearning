package com.smartlearning.controller;

import com.smartlearning.dto.AdminDocumentDto;
import com.smartlearning.service.AdminDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/documents")
@RequiredArgsConstructor
public class AdminDocumentController {

    private final AdminDocumentService adminDocumentService;

    /** ?userId=... để xem riêng tài liệu của 1 người dùng; bỏ trống để xem tất cả. */
    @GetMapping
    public ResponseEntity<List<AdminDocumentDto>> list(@RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(adminDocumentService.listAll(userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        adminDocumentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
