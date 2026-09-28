package com.smartlearning.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

@Data
public class SearchResultDto {
    private String text;
    private int page;
    private double score;
    @JsonIgnore
    private String heading = "";
    @JsonIgnore
    private String sectionId = "0";

    public SearchResultDto(String text, int page, double score) {
        this.text = text;
        this.page = page;
        this.score = score;
    }
}
