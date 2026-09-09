package com.smartlearning.service;

import com.smartlearning.client.LlmClient;
import com.smartlearning.client.PdfServiceClient;
import com.smartlearning.dto.ChatResponse;
import com.smartlearning.dto.SearchResultDto;
import com.smartlearning.entity.Conversation;
import com.smartlearning.entity.Document;
import com.smartlearning.entity.Message;
import com.smartlearning.entity.MessageRole;
import com.smartlearning.repository.ConversationRepository;
import com.smartlearning.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final int TOP_K = 5;

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final DocumentService documentService;
    private final PdfServiceClient pdfServiceClient;
    private final LlmClient llmClient;

    public ChatResponse ask(Long userId, Long documentId, Long conversationId, String question) {
        Document document = documentService.getOwned(userId, documentId);

        Conversation conversation = conversationId != null
                ? getOwnedConversation(userId, conversationId)
                : conversationRepository.save(Conversation.builder()
                        .userId(userId)
                        .documentId(documentId)
                        .title(question.length() > 60 ? question.substring(0, 60) + "..." : question)
                        .build());

        // 1. Retrieve
        List<SearchResultDto> hits = pdfServiceClient.search(document.getVectorDocId(), question, TOP_K);

        // 2. Build a grounded prompt
        String context = hits.stream()
                .map(h -> "[Page " + h.getPage() + "] " + h.getText())
                .collect(Collectors.joining("\n\n"));

        String systemPrompt = "You are a study assistant. Answer the user's question using ONLY the "
                + "provided document excerpts. Every claim must be traceable to the excerpts. "
                + "If the excerpts don't contain the answer, say so plainly. "
                + "Cite the page number(s) you used in square brackets, e.g. [Page 4].";

        String userPrompt = "Document excerpts:\n" + context + "\n\nQuestion: " + question;

        // 3. Generate
        String answer = llmClient.complete(systemPrompt, userPrompt);

        Set<Integer> citedPages = new LinkedHashSet<>();
        hits.forEach(h -> citedPages.add(h.getPage()));

        // 4. Persist both turns
        messageRepository.save(Message.builder()
                .conversationId(conversation.getId())
                .role(MessageRole.USER)
                .content(question)
                .build());

        messageRepository.save(Message.builder()
                .conversationId(conversation.getId())
                .role(MessageRole.ASSISTANT)
                .content(answer)
                .citationPages(citedPages.stream().map(String::valueOf).collect(Collectors.joining(",")))
                .build());

        List<Integer> sortedPages = citedPages.stream().sorted(Comparator.naturalOrder()).toList();
        return new ChatResponse(conversation.getId(), answer, sortedPages);
    }

    public List<Message> history(Long userId, Long conversationId) {
        getOwnedConversation(userId, conversationId);
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    public List<Conversation> listConversations(Long userId) {
        return conversationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    private Conversation getOwnedConversation(Long userId, Long conversationId) {
        Conversation c = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NoSuchElementException("Conversation not found"));
        if (!c.getUserId().equals(userId)) {
            throw new SecurityException("Not your conversation");
        }
        return c;
    }
}
