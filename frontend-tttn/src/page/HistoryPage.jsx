import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, History as HistoryIcon } from "lucide-react";

import { chatApi } from "~/api/index.js";
import Loading from "~/components/common/Loading.jsx";
import EmptyState from "~/components/common/EmptyState.jsx";
import "./HistoryPage.scss";

function HistoryPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    chatApi
      .listConversations()
      .then(setConversations)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="history-page">
      <h1 className="history-page__title">Lịch sử hội thoại</h1>

      {error && <p className="history-page__error">{error}</p>}

      {loading ? (
        <Loading />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="Chưa có hội thoại nào"
          description="Mở một tài liệu và trò chuyện với AI để xem lịch sử ở đây."
        />
      ) : (
        <div className="history-page__list">
          {conversations.map((c) => (
            <button
              key={c.id}
              className="history-page__item"
              onClick={() => navigate(`/document/${c.documentId}?conversationId=${c.id}`)}
            >
              <div className="history-page__icon">
                <MessageSquare size={18} />
              </div>

              <div>
                <p className="history-page__item-title">{c.title || `Hội thoại #${c.id}`}</p>
                <p className="history-page__item-meta">
                  {c.createdAt ? new Date(c.createdAt).toLocaleString("vi-VN") : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
