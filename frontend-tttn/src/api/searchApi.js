import { apiFetch } from "./apiClient.js";

export function semanticSearch(documentId, query, topK = 5) {
  const params = new URLSearchParams({ query, topK: String(topK) });
  return apiFetch(`/api/documents/${documentId}/search?${params.toString()}`);
}
