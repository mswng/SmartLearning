import { apiFetch } from "./apiClient.js";

export function getDocumentSummary(documentId, includeSections = true) {
  const params = new URLSearchParams({ sections: String(includeSections) });
  return apiFetch(`/api/documents/${documentId}/summary?${params.toString()}`);
}
