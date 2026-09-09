package com.smartlearning.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DashboardStatsDto {
    private long totalUsers;
    private long totalDocuments;
    private long totalConversations;
    private long totalQuizzes;
}
