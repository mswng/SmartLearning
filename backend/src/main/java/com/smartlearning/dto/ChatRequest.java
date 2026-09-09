package com.smartlearning.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChatRequest {
    /** Null starts a new conversation. */
    private Long conversationId;
    @NotBlank
    private String message;
}
