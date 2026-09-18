package com.smartlearning.client;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;

/**
 * Talks to any OpenAI-compatible /chat/completions endpoint. Works unmodified
 * against OpenAI, Azure OpenAI (with the right base-url), or a local
 * Ollama/vLLM server started with an OpenAI-compatible API.
 *
 * When no API key is configured (app.llm.api-key is blank), this falls back
 * to a simple extractive stub so the rest of the app (chat, summary, quiz)
 * is still exercisable without external credentials. Swap in a real key to
 * get real generations — no other code changes needed.
 */
@Component
public class OpenAiLlmClient implements LlmClient {

    private final RestTemplate restTemplate;

    @Value("${app.llm.api-key:}")
    private String apiKey;

    @Value("${app.llm.base-url:https://api.openai.com/v1}")
    private String baseUrl;

    @Value("${app.llm.model:gpt-4o-mini}")
    private String model;

    public OpenAiLlmClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public String complete(String systemPrompt, String userPrompt) {
        if (apiKey == null || apiKey.isBlank()) {
            return fallback(userPrompt);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        ChatCompletionRequest body = new ChatCompletionRequest(
                model,
                List.of(
                        new ChatMessage("system", systemPrompt),
                        new ChatMessage("user", userPrompt)
                ),
                0.3
        );

        HttpEntity<ChatCompletionRequest> request = new HttpEntity<>(body, headers);
        ChatCompletionResponse response = restTemplate.postForObject(
                baseUrl + "/chat/completions", request, ChatCompletionResponse.class);

        if (response == null || response.choices == null || response.choices.isEmpty()) {
            return fallback(userPrompt);
        }
        return response.choices.get(0).message.content;
    }

    /**
     * No-key fallback: not a real generation, just a clearly-labeled extractive
     * stub so `docker compose up` produces a working demo out of the box.
     * Replace by setting OPENAI_API_KEY (or point app.llm.base-url at a local
     * Ollama/vLLM server and set any non-blank api-key).
     */
    private String fallback(String userPrompt) {
        String trimmed = userPrompt.length() > 600 ? userPrompt.substring(0, 600) + "..." : userPrompt;
        return "[No LLM configured — showing the retrieved context verbatim as a stand-in answer]\n\n" + trimmed;
    }

    @Data
    @lombok.AllArgsConstructor
    private static class ChatCompletionRequest {
        private String model;
        private List<ChatMessage> messages;
        private double temperature;
    }

    @Data
    @lombok.AllArgsConstructor
    private static class ChatMessage {
        private String role;
        private String content;
    }

    @Data
    private static class ChatCompletionResponse {
        private List<Choice> choices;
    }

    @Data
    private static class Choice {
        private ChatMessage message;
    }
}
