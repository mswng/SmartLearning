import { apiFetch } from "./apiClient.js";

export function listDocuments() {
  return apiFetch("/api/documents");
}

export function uploadDocument(file, onProgress) {
  const formData = new FormData();
  formData.append("file", file);

  // apiFetch dùng fetch() (không hỗ trợ progress event thật sự), nên
  // onProgress ở đây chỉ để tương thích API — nếu cần progress bar chuẩn
  // (VD file PDF lớn), cân nhắc chuyển sang XMLHttpRequest riêng cho hàm này.
  void onProgress;

  return apiFetch("/api/documents", { method: "POST", formData });
}

export function deleteDocument(documentId) {
  return apiFetch(`/api/documents/${documentId}`, { method: "DELETE" });
}
