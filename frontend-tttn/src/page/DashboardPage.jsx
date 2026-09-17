import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Search, History, Brain } from "lucide-react";

import { documentApi } from "~/api/index.js";
import { useAuth } from "~/context/AuthContext.jsx";
import DocumentCard from "~/components/documents/DocumentCard.jsx";
import Loading from "~/components/common/Loading.jsx";
import EmptyState from "~/components/common/EmptyState.jsx";
import "./DashboardPage.scss";

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    documentApi
      .listDocuments()
      .then((docs) => setDocuments(docs.slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-page__title">Chào {user?.name || "bạn"} 👋</h1>
      <p className="dashboard-page__subtitle">
        Tải tài liệu PDF lên, trò chuyện, tóm tắt và tạo quiz cùng AI.
      </p>

      <div className="dashboard-page__quick-actions">
        <button className="dashboard-page__action" onClick={() => navigate("/documents")}>
          <FileText size={18} /> Tài liệu của tôi
        </button>
        <button className="dashboard-page__action" onClick={() => navigate("/search")}>
          <Search size={18} /> Tìm kiếm ngữ nghĩa
        </button>
        <button className="dashboard-page__action" onClick={() => navigate("/history")}>
          <History size={18} /> Lịch sử hội thoại
        </button>
      </div>

      <div className="dashboard-page__section">
        <h2>Tài liệu gần đây</h2>

        {loading ? (
          <Loading />
        ) : documents.length === 0 ? (
          <EmptyState
            icon={Brain}
            title="Chưa có tài liệu nào"
            description="Tải lên PDF đầu tiên để bắt đầu học cùng AI."
            action={
              <button className="dashboard-page__link" onClick={() => navigate("/documents")}>
                Tải tài liệu lên
              </button>
            }
          />
        ) : (
          <div className="dashboard-page__grid">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onClick={(d) => navigate(`/document/${d.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
