package com.smartlearning.dto;

import com.smartlearning.entity.DocumentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class DocumentDto {
    private Long id;
    private String filename;
    private DocumentStatus status;
    private Integer pageCount;
    private LocalDateTime createdAt;
}
