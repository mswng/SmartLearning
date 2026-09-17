import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import SourceCitation from "./SourceCitation.jsx";
import "./ChatMessage.scss";

// role khớp enum MessageRole bên backend: "USER" | "ASSISTANT"
function ChatMessage({ role, content, citedPages }) {
  const isUser = role === "USER";

  return (
    <div className={`chat-message${isUser ? " chat-message--user" : ""}`}>
      <div className="chat-message__avatar">
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div>
        <div className="chat-message__bubble">
          {isUser ? (
            <p className="chat-message__text">{content}</p>
          ) : (
            // Câu trả lời từ LLM (Gemini/OpenAI...) là Markdown thật
            // (**in đậm**, danh sách *...) — parse bằng react-markdown
            // thay vì in ra chữ thô.
            <div className="chat-message__text chat-message__markdown">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && <SourceCitation pages={citedPages} />}
      </div>
    </div>
  );
}

export default ChatMessage;
