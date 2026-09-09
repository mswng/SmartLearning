package com.smartlearning.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartlearning.client.LlmClient;
import com.smartlearning.client.PdfServiceClient;
import com.smartlearning.dto.QuizDto;
import com.smartlearning.dto.QuizQuestionDto;
import com.smartlearning.dto.SearchResultDto;
import com.smartlearning.entity.Document;
import com.smartlearning.entity.Quiz;
import com.smartlearning.entity.QuizQuestion;
import com.smartlearning.repository.QuizQuestionRepository;
import com.smartlearning.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuizService {

    private static final String QUIZ_SYSTEM_PROMPT = """
            You write one multiple-choice quiz question testing understanding of the given \
            passage. Respond with ONLY a JSON object, no markdown fences, no commentary, in \
            exactly this shape:
            {"question": "...", "optionA": "...", "optionB": "...", "optionC": "...", \
            "optionD": "...", "correctAnswer": "A", "explanation": "..."}
            correctAnswer must be one of "A", "B", "C", "D".
            """;

    private final DocumentService documentService;
    private final PdfServiceClient pdfServiceClient;
    private final LlmClient llmClient;
    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public QuizDto generate(Long userId, Long documentId, int numQuestions) {
        Document document = documentService.getOwned(userId, documentId);
        List<SearchResultDto> chunks = pdfServiceClient.fullText(document.getVectorDocId());

        if (chunks.isEmpty()) {
            throw new IllegalStateException("Document has no processed content yet");
        }

        List<SearchResultDto> sampled = sampleEvenly(chunks, numQuestions);

        Quiz quiz = quizRepository.save(Quiz.builder()
                .userId(userId)
                .documentId(documentId)
                .title("Quiz: " + document.getFilename())
                .build());

        List<QuizQuestionDto> questionDtos = new ArrayList<>();
        for (SearchResultDto chunk : sampled) {
            QuizQuestion q = generateOneQuestion(quiz.getId(), chunk);
            quizQuestionRepository.save(q);
            questionDtos.add(toDto(q));
        }

        return new QuizDto(quiz.getId(), quiz.getTitle(), questionDtos);
    }

    public QuizDto get(Long userId, Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new NoSuchElementException("Quiz not found"));
        if (!quiz.getUserId().equals(userId)) {
            throw new SecurityException("Not your quiz");
        }
        List<QuizQuestionDto> questions = quizQuestionRepository.findByQuizId(quizId)
                .stream().map(this::toDto).toList();
        return new QuizDto(quiz.getId(), quiz.getTitle(), questions);
    }

    private QuizQuestion generateOneQuestion(Long quizId, SearchResultDto chunk) {
        String raw = llmClient.complete(QUIZ_SYSTEM_PROMPT, "Passage (page " + chunk.getPage() + "):\n" + chunk.getText());

        try {
            String cleaned = raw.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceAll("^```[a-zA-Z]*", "").replaceAll("```$", "").trim();
            }
            JsonNode node = objectMapper.readTree(cleaned);
            return QuizQuestion.builder()
                    .quizId(quizId)
                    .question(node.path("question").asText())
                    .optionA(node.path("optionA").asText())
                    .optionB(node.path("optionB").asText())
                    .optionC(node.path("optionC").asText())
                    .optionD(node.path("optionD").asText())
                    .correctAnswer(node.path("correctAnswer").asText("A"))
                    .explanation(node.path("explanation").asText(""))
                    .build();
        } catch (Exception e) {
            log.warn("Could not parse LLM quiz JSON, using fallback stub question. Raw: {}", raw);
            return QuizQuestion.builder()
                    .quizId(quizId)
                    .question("(Auto-generated placeholder — configure a real LLM for graded questions) "
                            + "What is discussed on page " + chunk.getPage() + "?")
                    .optionA(truncate(chunk.getText(), 120))
                    .optionB("An unrelated topic")
                    .optionC("An unrelated topic")
                    .optionD("An unrelated topic")
                    .correctAnswer("A")
                    .explanation("See page " + chunk.getPage() + " of the source document.")
                    .build();
        }
    }

    private List<SearchResultDto> sampleEvenly(List<SearchResultDto> chunks, int n) {
        int count = Math.min(n, chunks.size());
        List<SearchResultDto> result = new ArrayList<>();
        if (count <= 0) return result;
        double step = (double) chunks.size() / count;
        for (int i = 0; i < count; i++) {
            result.add(chunks.get((int) Math.floor(i * step)));
        }
        return result;
    }

    private String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }

    private QuizQuestionDto toDto(QuizQuestion q) {
        return new QuizQuestionDto(q.getId(), q.getQuestion(), q.getOptionA(), q.getOptionB(),
                q.getOptionC(), q.getOptionD(), q.getCorrectAnswer(), q.getExplanation());
    }
}
