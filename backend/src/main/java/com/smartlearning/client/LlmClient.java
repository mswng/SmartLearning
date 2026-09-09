package com.smartlearning.client;

public interface LlmClient {
    /**
     * @param systemPrompt instructions for the model (persona, output format, constraints)
     * @param userPrompt   the actual question/task, typically with retrieved context inlined
     * @return the model's raw text response
     */
    String complete(String systemPrompt, String userPrompt);
}
