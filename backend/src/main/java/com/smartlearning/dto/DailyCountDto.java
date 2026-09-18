package com.smartlearning.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** Một điểm dữ liệu cho biểu đồ: số lượng phát sinh trong 1 ngày cụ thể. */
@Data
@AllArgsConstructor
public class DailyCountDto {
    private String date; // "yyyy-MM-dd"
    private long count;
}
