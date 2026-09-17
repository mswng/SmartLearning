package com.smartlearning.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartlearning.dto.SearchResultDto;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PdfServiceClient {

    private final RestTemplate restTemplate;

    @Value("${app.pdf-service.base-url:http://localhost:8001}")
    private String baseUrl;

    public ProcessResult process(File pdfFile, String vectorDocId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new FileSystemResource(pdfFile));

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        String url = baseUrl + "/process?document_id=" + vectorDocId;
        return restTemplate.postForObject(url, request, ProcessResult.class);
    }

    public List<SearchResultDto> search(String vectorDocId, String query, int topK) {
        try {
            SearchRequestBody req = new SearchRequestBody(query, topK);
            SearchResponseBody resp = restTemplate.postForObject(
                    baseUrl + "/search/" + vectorDocId, req, SearchResponseBody.class);

            if (resp == null || resp.hits == null) return List.of();
            return resp.hits.stream()
                    .map(h -> new SearchResultDto(h.text, h.page, h.score))
                    .collect(Collectors.toList());
        } catch (RestClientException e) {
            throw translate(e, vectorDocId);
        }
    }

    public List<SearchResultDto> fullText(String vectorDocId) {
        try {
            FullTextResponseBody resp = restTemplate.getForObject(
                    baseUrl + "/fulltext/" + vectorDocId, FullTextResponseBody.class);

            if (resp == null || resp.chunks == null) return List.of();
            return resp.chunks.stream()
                    .map(h -> new SearchResultDto(h.text, h.page, h.score))
                    .collect(Collectors.toList());
        } catch (RestClientException e) {
            throw translate(e, vectorDocId);
        }
    }

    public void deleteIndex(String vectorDocId) {
        restTemplate.delete(baseUrl + "/index/" + vectorDocId);
    }
    private PdfServiceException translate(RestClientException e, String vectorDocId) {
        if (e instanceof ResourceAccessException) {
            return new PdfServiceException(
                    "Không kết nối được tới pdf-service tại " + baseUrl
                            + ". Kiểm tra pdf-service đã chạy chưa (uvicorn main:app --port 8001).", e);
        }
        if (e instanceof HttpClientErrorException httpEx && httpEx.getStatusCode().value() == 404) {
            return new PdfServiceException(
                    "Không tìm thấy dữ liệu đã xử lý cho tài liệu này trên pdf-service (vectorDocId="
                            + vectorDocId + "). Nếu pdf-service từng bị khởi động lại từ thư mục khác, "
                            + "index FAISS cũ (lưu ở đường dẫn tương đối ./data/faiss) sẽ không tìm thấy nữa "
                            + "— hãy xóa và tải lại tài liệu này.", e);
        }
        return new PdfServiceException("Lỗi khi gọi pdf-service: " + e.getMessage(), e);
    }
    public static class PdfServiceException extends RuntimeException {
        public PdfServiceException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    @Data
    public static class ProcessResult {
        @JsonProperty("document_id")
        private String documentId;
        @JsonProperty("page_count")
        private int pageCount;
        @JsonProperty("chunk_count")
        private int chunkCount;
    }

    @Data
    @lombok.AllArgsConstructor
    private static class SearchRequestBody {
        private String query;
        @JsonProperty("top_k")
        private int topK;
    }

    @Data
    private static class SearchResponseBody {
        @JsonProperty("document_id")
        private String documentId;
        private List<Hit> hits;
    }

    @Data
    private static class FullTextResponseBody {
        @JsonProperty("document_id")
        private String documentId;
        @JsonProperty("page_count")
        private int pageCount;
        private List<Hit> chunks;
    }

    @Data
    private static class Hit {
        private String text;
        private int page;
        private double score;
    }
}
