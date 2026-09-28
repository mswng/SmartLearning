package com.smartlearning.service;

import com.smartlearning.client.LlmClient;
import com.smartlearning.client.PdfServiceClient;
import com.smartlearning.dto.SearchResultDto;
import com.smartlearning.entity.Document;
import org.junit.jupiter.api.Test;
import java.util.ArrayList;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SummaryServiceTest {
    @Test
    void groupsSectionsAcrossPagesAndPreservesPublicContract() {
        DocumentService documents = mock(DocumentService.class);
        PdfServiceClient pdf = mock(PdfServiceClient.class);
        LlmClient llm = mock(LlmClient.class);
        Document doc = mock(Document.class);
        when(doc.getVectorDocId()).thenReturn("test");
        when(documents.getOwned(1L, 2L)).thenReturn(doc);
        SearchResultDto a = chunk("First definition.", 1, "1", "Chapter 1");
        SearchResultDto b = chunk("More details.", 2, "1", "Chapter 1");
        SearchResultDto c = chunk("Second topic.", 3, "2", "Chapter 2");
        when(pdf.fullText("test")).thenReturn(List.of(a, b, c));
        when(llm.complete(anyString(), anyString())).thenReturn("Concise grounded summary.");
        var service = new SummaryService(documents, pdf, llm);
        var result = service.summarize(1L, 2L, true);
        assertEquals(2, result.getSections().size());
        assertEquals(1, result.getSections().get(0).getFromPage());
        assertEquals(2, result.getSections().get(0).getToPage());
        verify(llm).complete(anyString(), contains("First definition.\nMore details."));
        assertTrue(service.summarize(1L, 2L, false).getSections().isEmpty());
    }

    @Test
    void boundsAllInputsForLargeSections() {
        DocumentService documents = mock(DocumentService.class);
        PdfServiceClient pdf = mock(PdfServiceClient.class);
        LlmClient llm = mock(LlmClient.class);
        Document doc = mock(Document.class);
        when(doc.getVectorDocId()).thenReturn("large");
        when(documents.getOwned(1L, 2L)).thenReturn(doc);
        List<SearchResultDto> chunks = new ArrayList<>();
        for (int i = 0; i < 40; i++) chunks.add(chunk(i + " evidence ".repeat(100), i + 1, "1", "Chapter 1"));
        when(pdf.fullText("large")).thenReturn(chunks);
        when(llm.complete(anyString(), anyString())).thenAnswer(call -> {
            assertTrue(call.getArgument(1, String.class).length() <= SummaryService.INPUT_CHARS);
            return "Grounded section summary.";
        });
        var result = new SummaryService(documents, pdf, llm).summarize(1L, 2L, true);
        assertEquals(1, result.getSections().size());
        assertEquals(40, result.getSections().get(0).getToPage());
        verify(llm, atLeast(3)).complete(anyString(), anyString());
    }

    @Test
    void batchingKeepsWordsAndContent() {
        String content = "definition ".repeat(1800);
        var batches = SummaryService.batches(List.of(content));
        assertTrue(batches.size() > 1);
        assertTrue(batches.stream().allMatch(s -> s.length() <= SummaryService.INPUT_CHARS));
        assertEquals(content.trim(), String.join("", batches).trim());
    }

    private SearchResultDto chunk(String text, int page, String section, String heading) {
        var c = new SearchResultDto(text, page, 0);
        c.setSectionId(section);
        c.setHeading(heading);
        return c;
    }
}
