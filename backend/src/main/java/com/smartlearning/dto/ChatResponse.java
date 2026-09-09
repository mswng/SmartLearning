package com.smartlearning.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ChatResponse {
    private Long conversationId;
    private String answer;
    private List<Integer> citedPages;
}
