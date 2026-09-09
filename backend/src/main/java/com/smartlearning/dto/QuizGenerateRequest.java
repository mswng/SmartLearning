package com.smartlearning.dto;

import lombok.Data;

@Data
public class QuizGenerateRequest {
    private Long documentId;
    private int numQuestions = 5;
}
