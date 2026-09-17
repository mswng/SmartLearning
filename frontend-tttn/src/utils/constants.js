// Địa chỉ backend Spring Boot. Đọc từ biến môi trường VITE_API_BASE_URL
// (khai báo trong file .env, xem .env.example) — không set thì mặc định
// http://localhost:8080, đúng với hướng dẫn chạy backend không dùng Docker.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// Khớp với enum DocumentStatus bên backend (com.smartlearning.entity.DocumentStatus).
export const DOCUMENT_STATUS = {
  UPLOADED: "UPLOADED",
  PROCESSING: "PROCESSING",
  READY: "READY",
  FAILED: "FAILED",
};

// Khớp với enum MessageRole bên backend (com.smartlearning.entity.MessageRole).
export const MESSAGE_ROLE = {
  USER: "USER",
  ASSISTANT: "ASSISTANT",
};

export const STORAGE_KEYS = {
  TOKEN: "smartlearning_token",
  USER: "smartlearning_user",
};
