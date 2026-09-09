package com.smartlearning.service;

import com.smartlearning.client.LlmClient;
import com.smartlearning.client.PdfServiceClient;
import com.smartlearning.dto.SearchResultDto;
import com.smartlearning.dto.SummaryResponse;
import com.smartlearning.entity.Document;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SummaryService {

    /** How many chunks to batch together into one "section" before summarizing. */
    private static final int CHUNKS_PER_SECTION = 6;

    private final DocumentService documentService;
    private final PdfServiceClient pdfServiceClient;
    private final LlmClient llmClient;

    public SummaryResponse summarize(Long userId, Long documentId, boolean includeSections) {
        Document document = documentService.getOwned(userId, documentId);
        List<SearchResultDto> chunks = pdfServiceClient.fullText(document.getVectorDocId());

        List<SummaryResponse.SectionSummary> sectionSummaries = new ArrayList<>();
        List<String> sectionSummaryTexts = new ArrayList<>();

        for (int i = 0; i < chunks.size(); i += CHUNKS_PER_SECTION) {
            List<SearchResultDto> batch = chunks.subList(i, Math.min(i + CHUNKS_PER_SECTION, chunks.size()));
            int fromPage = batch.get(0).getPage();
            int toPage = batch.get(batch.size() - 1).getPage();

            String sectionText = batch.stream().map(SearchResultDto::getText).collect(Collectors.joining("\n"));
            String summary = llmClient.complete(
                    "You are summarizing one section of a document for a student. "
                            + "Write 2-4 concise sentences capturing the key points. No preamble.",
                    sectionText
            );

            sectionSummaries.add(new SummaryResponse.SectionSummary(fromPage, toPage, summary));
            sectionSummaryTexts.add("(p." + fromPage + "-" + toPage + ") " + summary);
        }

        String overall = llmClient.complete(
                "You are producing a single cohesive summary of an entire document from a list of "
                        + "section summaries. Write 4-8 sentences covering the overall structure and "
                        + "the most important ideas. No preamble.",
                String.join("\n", sectionSummaryTexts)
        );

        return new SummaryResponse(overall, includeSections ? sectionSummaries : List.of());
    }
}
