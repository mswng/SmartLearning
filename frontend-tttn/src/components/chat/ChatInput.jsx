import { useState } from "react";
import { Send } from "lucide-react";
import "./ChatInput.scss";

function ChatInput({ onSend, disabled = false }) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <div className="chat-input">
      <textarea
        className="chat-input__textarea"
        rows={1}
        placeholder="Hỏi gì đó về tài liệu này..."
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />

      <button
        className="chat-input__send"
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Gửi"
      >
        <Send size={16} />
      </button>
    </div>
  );
}

export default ChatInput;
