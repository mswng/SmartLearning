import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileStack } from "lucide-react";

import { documentApi } from "~/api/index.js";
import UploadDocument from "~/components/documents/UploadDocument.jsx";
import DocumentCard from "~/components/documents/DocumentCard.jsx";
import Loading from "~/components/common/Loading.jsx";
import EmptyState from "~/components/common/EmptyState.jsx";
import "./DocumentsPage.scss";

function DocumentsPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    documentApi
      .listDocuments()
      .then(setDocuments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Backend xử lý PDF (trích xuất + chunk + embedding + FAISS) ĐỒNG BỘ
  // ngay trong lúc upload, nên request này có thể mất vài giây với PDF
  // dài — doc trả về đã có status cuối cùng (READY/FAILED), không cần
  // polling thêm.
  const handleUpload = async (file) => {
    setUploading(true);
    setError(null);
    try {
      const doc = await documentApi.uploadDocument(file);
      setDocuments((prev) => [doc, ...prev]);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Xóa "${doc.filename}"?`)) return;
    try {
      await documentApi.deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="documents-page">
      <h1 className="documents-page__title">Tài liệu của tôi</h1>

      <UploadDocument onUpload={handleUpload} uploading={uploading} />

      {error && <p className="documents-page__error">{error}</p>}

      <div className="documents-page__list">
        {loading ? (
          <Loading />
        ) : documents.length === 0 ? (
          <EmptyState
            icon={FileStack}
            title="Chưa có tài liệu nào"
            description="Tải lên file PDF ở trên để bắt đầu."
          />
        ) : (
          <div className="documents-page__grid">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onClick={(d) => navigate(`/document/${d.id}`)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentsPage;
