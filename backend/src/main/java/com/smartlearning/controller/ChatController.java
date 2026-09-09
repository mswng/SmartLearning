package com.smartlearning.controller;

import com.smartlearning.config.JwtAuthFilter.AuthenticatedUser;
import com.smartlearning.dto.ChatRequest;
import com.smartlearning.dto.ChatResponse;
import com.smartlearning.entity.Conversation;
import com.smartlearning.entity.Message;
import com.smartlearning.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/api/documents/{documentId}/chat")
    public ResponseEntity<ChatResponse> chat(@AuthenticationPrincipal AuthenticatedUser user,
                                              @PathVariable Long documentId,
                                              @Valid @RequestBody ChatRequest request) {
        ChatResponse response = chatService.ask(user.id(), documentId, request.getConversationId(), request.getMessage());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/conversations")
    public ResponseEntity<List<Conversation>> listConversations(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(chatService.listConversations(user.id()));
    }

    @GetMapping("/api/conversations/{conversationId}/messages")
    public ResponseEntity<List<Message>> history(@AuthenticationPrincipal AuthenticatedUser user,
                                                  @PathVariable Long conversationId) {
        return ResponseEntity.ok(chatService.history(user.id(), conversationId));
    }
}
