package com.smartlearning.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class QuizDto {
    private Long id;
    private String title;
    private List<QuizQuestionDto> questions;
}
