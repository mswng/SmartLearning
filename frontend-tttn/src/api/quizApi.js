import { apiFetch } from "./apiClient.js";

export function generateQuiz(documentId, numQuestions = 5) {
  return apiFetch("/api/quizzes/generate", {
    method: "POST",
    body: { documentId, numQuestions },
  });
}

export function getQuiz(quizId) {
  return apiFetch(`/api/quizzes/${quizId}`);
}
