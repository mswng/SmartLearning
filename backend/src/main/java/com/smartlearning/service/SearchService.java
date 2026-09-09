package com.smartlearning.service;

import com.smartlearning.client.PdfServiceClient;
import com.smartlearning.dto.SearchResultDto;
import com.smartlearning.entity.Document;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final PdfServiceClient pdfServiceClient;
    private final DocumentService documentService;

    public List<SearchResultDto> semanticSearch(Long userId, Long documentId, String query, int topK) {
        Document doc = documentService.getOwned(userId, documentId);
        return pdfServiceClient.search(doc.getVectorDocId(), query, topK);
    }
}
