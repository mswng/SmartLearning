import { apiFetch } from "./apiClient.js";

export function sendChatMessage(documentId, message, conversationId) {
  return apiFetch(`/api/documents/${documentId}/chat`, {
    method: "POST",
    body: { message, conversationId: conversationId ?? null },
  });
}

export function listConversations() {
  return apiFetch("/api/conversations");
}

export function getConversationMessages(conversationId) {
  return apiFetch(`/api/conversations/${conversationId}/messages`);
}
