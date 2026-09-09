package com.smartlearning.service;

import com.smartlearning.client.PdfServiceClient;
import com.smartlearning.dto.DocumentDto;
import com.smartlearning.entity.Document;
import com.smartlearning.entity.DocumentStatus;
import com.smartlearning.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final PdfServiceClient pdfServiceClient;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    public DocumentDto upload(Long userId, MultipartFile file) throws IOException {
        Path dir = Path.of(uploadDir);
        Files.createDirectories(dir);

        String storedFilename = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path storedPath = dir.resolve(storedFilename);
        file.transferTo(storedPath);

        Document document = Document.builder()
                .userId(userId)
                .filename(file.getOriginalFilename())
                .filePath(storedPath.toString())
                .status(DocumentStatus.UPLOADED)
                .build();
        document = documentRepository.save(document);

        // vectorDocId ties this row to its FAISS index in the Python service
        document.setVectorDocId("doc-" + document.getId());
        document.setStatus(DocumentStatus.PROCESSING);
        documentRepository.save(document);

        try {
            PdfServiceClient.ProcessResult result =
                    pdfServiceClient.process(storedPath.toFile(), document.getVectorDocId());
            document.setPageCount(result.getPageCount());
            document.setStatus(DocumentStatus.READY);
        } catch (Exception e) {
            log.error("PDF processing failed for document {}", document.getId(), e);
            document.setStatus(DocumentStatus.FAILED);
        }
        document = documentRepository.save(document);

        return toDto(document);
    }

    public List<DocumentDto> listForUser(Long userId) {
        return documentRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDto).toList();
    }

    public Document getOwned(Long userId, Long documentId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new NoSuchElementException("Document not found"));
        if (!doc.getUserId().equals(userId)) {
            throw new SecurityException("Not your document");
        }
        return doc;
    }

    public void delete(Long userId, Long documentId) {
        Document doc = getOwned(userId, documentId);
        if (doc.getVectorDocId() != null) {
            try {
                pdfServiceClient.deleteIndex(doc.getVectorDocId());
            } catch (Exception e) {
                log.warn("Could not delete vector index for document {}", documentId, e);
            }
        }
        try {
            Files.deleteIfExists(Path.of(doc.getFilePath()));
        } catch (IOException e) {
            log.warn("Could not delete file for document {}", documentId, e);
        }
        documentRepository.delete(doc);
    }

    private DocumentDto toDto(Document d) {
        return new DocumentDto(d.getId(), d.getFilename(), d.getStatus(), d.getPageCount(), d.getCreatedAt());
    }
}
