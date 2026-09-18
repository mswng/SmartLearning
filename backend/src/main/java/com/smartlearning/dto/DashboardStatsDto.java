package com.smartlearning.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class DashboardStatsDto {
    private long totalUsers;
    private long totalDocuments;
    private long totalConversations;
    private long totalQuizzes;

    /** Số user mới đăng ký theo từng ngày, 14 ngày gần nhất — để vẽ biểu đồ. */
    private List<DailyCountDto> userGrowth;

    /** Số tài liệu được tải lên theo từng ngày, 14 ngày gần nhất — để vẽ biểu đồ. */
    private List<DailyCountDto> documentGrowth;
}
