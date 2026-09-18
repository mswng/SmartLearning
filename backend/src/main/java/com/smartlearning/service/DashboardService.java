package com.smartlearning.service;

import com.smartlearning.dto.DailyCountDto;
import com.smartlearning.dto.DashboardStatsDto;
import com.smartlearning.entity.Document;
import com.smartlearning.entity.User;
import com.smartlearning.repository.ConversationRepository;
import com.smartlearning.repository.DocumentRepository;
import com.smartlearning.repository.QuizRepository;
import com.smartlearning.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final int TREND_DAYS = 14;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final ConversationRepository conversationRepository;
    private final QuizRepository quizRepository;

    public DashboardStatsDto stats() {
        List<User> users = userRepository.findAll();
        List<Document> documents = documentRepository.findAll();

        return new DashboardStatsDto(
                users.size(),
                documents.size(),
                conversationRepository.count(),
                quizRepository.count(),
                dailyTrend(users.stream().map(u -> u.getCreatedAt().toLocalDate()).toList()),
                dailyTrend(documents.stream().map(d -> d.getCreatedAt().toLocalDate()).toList())
        );
    }

    /**
     * Gom số lượng phát sinh theo từng ngày trong {@value #TREND_DAYS} ngày
     * gần nhất. Tính trực tiếp trong Java (không dùng GROUP BY theo ngày ở
     * DB) vì quy mô dữ liệu của dự án còn nhỏ — tránh phải viết SQL riêng
     * cho từng loại DB (MySQL/H2/Postgres... có hàm date-trunc khác nhau).
     */
    private List<DailyCountDto> dailyTrend(List<LocalDate> dates) {
        Map<LocalDate, Long> counts = dates.stream()
                .collect(Collectors.groupingBy(d -> d, Collectors.counting()));

        LocalDate today = LocalDate.now();
        List<DailyCountDto> result = new ArrayList<>();
        for (int i = TREND_DAYS - 1; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            result.add(new DailyCountDto(day.format(DATE_FMT), counts.getOrDefault(day, 0L)));
        }
        return result;
    }
}
