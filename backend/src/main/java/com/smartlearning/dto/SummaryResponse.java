package com.smartlearning.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class SummaryResponse {
    private String overallSummary;
    private List<SectionSummary> sections;

    @Data
    @AllArgsConstructor
    public static class SectionSummary {
        private int fromPage;
        private int toPage;
        private String summary;
    }
}
