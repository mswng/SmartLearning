import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { MessageSquare, FileText, HelpCircle, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { documentApi, chatApi, summaryApi, quizApi } from "~/api/index.js";
import ChatMessage from "~/components/chat/ChatMessage.jsx";
import ChatInput from "~/components/chat/ChatInput.jsx";
import QuizQuestionCard from "~/components/quiz/QuizQuestionCard.jsx";
import Loading from "~/components/common/Loading.jsx";
import Button from "~/components/common/Button.jsx";
import "./DocumentDetailPage.scss";

const TABS = [
  { key: "chat", label: "Trò chuyện", icon: MessageSquare },
  { key: "summary", label: "Tóm tắt", icon: FileText },
  { key: "quiz", label: "Trắc nghiệm", icon: HelpCircle },
];

function parsePages(citationPages) {
  return citationPages
    ? String(citationPages).split(",").filter(Boolean).map(Number)
    : [];
}

function DocumentDetailPage() {
  const { documentId } = useParams();
  const [searchParams] = useSearchParams();

  const [docInfo, setDocInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("chat");
  const [error, setError] = useState(null);

  // --- tab Trò chuyện ---
  // ?conversationId=... trên URL: cho phép HistoryPage mở lại đúng hội
  // thoại cũ.
  const [conversationId, setConversationId] = useState(() => {
    const raw = searchParams.get("conversationId");
    return raw ? Number(raw) : null;
  });
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // --- tab Tóm tắt ---
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // --- tab Trắc nghiệm ---
  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);

  // Backend chưa có API GET /api/documents/{id} riêng lẻ, nên lấy thông
  // tin tài liệu (tên file, trạng thái) bằng cách lọc từ danh sách chung.
  useEffect(() => {
    documentApi
      .listDocuments()
      .then((docs) => {
        const found = docs.find((d) => String(d.id) === String(documentId));
        setDocInfo(found ?? null);
        if (!found) setError("Không tìm thấy tài liệu này.");
      })
      .catch((e) => setError(e.message));
  }, [documentId]);

  useEffect(() => {
    if (!conversationId) return;
    chatApi
      .getConversationMessages(conversationId)
      .then(setMessages)
      .catch(() => {});
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async (text) => {
    setSending(true);
    setError(null);
    setMessages((prev) => [...prev, { role: "USER", content: text }]);
    try {
      const res = await chatApi.sendChatMessage(documentId, text, conversationId);
      setConversationId(res.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          role: "ASSISTANT",
          content: res.answer,
          citationPages: res.citedPages?.join(","),
        },
      ]);
    } catch (e) {
      setError(e.message);
      // bỏ tin nhắn user vừa thêm lạc quan nếu gọi API thất bại
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const handleSummarize = async () => {
    setSummaryLoading(true);
    setError(null);
    try {
      const res = await summaryApi.getDocumentSummary(documentId, true);
      setSummary(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setQuizLoading(true);
    setError(null);
    try {
      const res = await quizApi.generateQuiz(documentId, numQuestions);
      setQuiz(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setQuizLoading(false);
    }
  };

  return (
    <div className="document-detail-page">
      <h1 className="document-detail-page__title">
        {docInfo?.filename ?? `Tài liệu #${documentId}`}
      </h1>

      <div className="document-detail-page__tabs">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`document-detail-page__tab${
              activeTab === key ? " document-detail-page__tab--active" : ""
            }`}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {error && <p className="document-detail-page__error">{error}</p>}

      <div className="document-detail-page__panel">
        {activeTab === "chat" && (
          <div className="document-detail-page__chat">
            <div className="document-detail-page__messages">
              {messages.length === 0 ? (
                <p className="document-detail-page__hint">
                  Đặt câu hỏi về nội dung tài liệu — câu trả lời sẽ trích dẫn số
                  trang nguồn.
                </p>
              ) : (
                messages.map((m, i) => (
                  <ChatMessage
                    key={i}
                    role={m.role}
                    content={m.content}
                    citedPages={parsePages(m.citationPages)}
                  />
                ))
              )}
              {sending && <Loading label="AI đang trả lời..." />}
              <div ref={messagesEndRef} />
            </div>

            <ChatInput onSend={handleSend} disabled={sending} />
          </div>
        )}

        {activeTab === "summary" && (
          <div>
            {!summary && !summaryLoading && (
              <Button onClick={handleSummarize}>
                <Sparkles size={16} /> Tạo tóm tắt bằng AI
              </Button>
            )}

            {summaryLoading && <Loading label="Đang tóm tắt tài liệu..." />}

            {summary && (
              <>
                <div className="document-detail-page__summary-text">
                  <ReactMarkdown>{summary.overallSummary}</ReactMarkdown>
                </div>

                {summary.sections?.length > 0 && (
                  <>
                    <h3>Theo từng phần</h3>
                    {summary.sections.map((s, i) => (
                      <div key={i} className="document-detail-page__section-summary">
                        <span className="document-detail-page__section-pages">
                          Trang {s.fromPage}–{s.toPage}
                        </span>
                        <ReactMarkdown>{s.summary}</ReactMarkdown>
                      </div>
                    ))}
                  </>
                )}

                <Button variant="secondary" onClick={handleSummarize} loading={summaryLoading}>
                  Tóm tắt lại
                </Button>
              </>
            )}
          </div>
        )}

        {activeTab === "quiz" && (
          <div>
            <div className="document-detail-page__quiz-controls">
              <label htmlFor="numQuestions">Số câu hỏi:</label>
              <input
                id="numQuestions"
                type="number"
                min={1}
                max={20}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
              />
              <Button onClick={handleGenerateQuiz} loading={quizLoading}>
                Tạo quiz
              </Button>
            </div>

            {quizLoading && <Loading label="Đang tạo câu hỏi..." />}

            {quiz && (
              <div className="document-detail-page__quiz-list">
                {quiz.questions.map((q, i) => (
                  <QuizQuestionCard key={q.id ?? i} index={i} question={q} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentDetailPage;
