import { useEffect, useState } from "react";
import { Trash2, FileText, ShieldAlert } from "lucide-react";

import { adminApi } from "~/api/index.js";
import Loading from "~/components/common/Loading.jsx";
import EmptyState from "~/components/common/EmptyState.jsx";
import "./AdminDocumentsPage.scss";

const STATUS_LABEL = {
  READY: "Sẵn sàng",
  PROCESSING: "Đang xử lý",
  UPLOADED: "Đã tải lên",
  FAILED: "Lỗi xử lý",
};

function AdminDocumentsPage() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Danh sách user cho dropdown lọc — gọi 1 lần.
  useEffect(() => {
    adminApi.listUsers().then(setUsers).catch(() => {});
  }, []);

  const load = (userId) => {
    setLoading(true);
    setError(null);
    adminApi
      .listAllDocuments(userId || undefined)
      .then(setDocuments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(selectedUserId), [selectedUserId]);

  const handleDelete = async (doc) => {
    if (
      !window.confirm(
        `Xóa tài liệu "${doc.filename}" của ${doc.ownerName}? Toàn bộ hội thoại và quiz liên quan cũng sẽ bị xóa. Hành động này không thể hoàn tác.`
      )
    )
      return;

    try {
      await adminApi.deleteDocumentAsAdmin(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (e) {
      setError(e.message);
    }
  };

  const totalQuizzes = documents.reduce((sum, d) => sum + d.quizCount, 0);
  const totalQuestions = documents.reduce((sum, d) => sum + d.questionCount, 0);

  return (
    <div className="admin-documents-page">
      <h1 className="admin-documents-page__title">Tài liệu & Trắc nghiệm</h1>
      <p className="admin-documents-page__subtitle">
        Quản lý metadata tài liệu và số câu hỏi trắc nghiệm phát sinh theo
        từng người dùng. Không thể xem nội dung PDF từ đây — chỉ có thể xóa
        để đảm bảo dữ liệu không bị rò rỉ khi cần.
      </p>

      <div className="admin-documents-page__toolbar">
        <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
          <option value="">Tất cả người dùng</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>

        <div className="admin-documents-page__summary">
          <span>
            <FileText size={14} /> {documents.length} tài liệu
          </span>
          <span>{totalQuizzes} bộ quiz</span>
          <span>{totalQuestions} câu hỏi</span>
        </div>
      </div>

      {error && <p className="admin-documents-page__error">{error}</p>}

      {loading ? (
        <Loading />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="Không có tài liệu nào"
          description="Chưa có tài liệu nào khớp với bộ lọc hiện tại."
        />
      ) : (
        <div className="admin-documents-page__table-wrap">
          <table className="admin-documents-page__table">
            <thead>
              <tr>
                <th>Tên file</th>
                <th>Người tải lên</th>
                <th>Trạng thái</th>
                <th>Số trang</th>
                <th>Số quiz</th>
                <th>Số câu hỏi</th>
                <th>Ngày tải</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id}>
                  <td className="admin-documents-page__filename" title={d.filename}>
                    {d.filename}
                  </td>
                  <td>
                    <div>{d.ownerName}</div>
                    <div className="admin-documents-page__owner-email">{d.ownerEmail}</div>
                  </td>
                  <td>
                    <span
                      className={`admin-documents-page__status admin-documents-page__status--${d.status?.toLowerCase()}`}
                    >
                      {STATUS_LABEL[d.status] ?? d.status}
                    </span>
                  </td>
                  <td>{d.pageCount ?? "—"}</td>
                  <td>{d.quizCount}</td>
                  <td>{d.questionCount}</td>
                  <td>{d.createdAt ? new Date(d.createdAt).toLocaleDateString("vi-VN") : ""}</td>
                  <td>
                    <button
                      className="admin-documents-page__delete-btn"
                      onClick={() => handleDelete(d)}
                      aria-label="Xóa tài liệu"
                      title="Xóa tài liệu"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminDocumentsPage;
