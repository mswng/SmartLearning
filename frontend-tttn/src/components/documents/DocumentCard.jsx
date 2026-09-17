import { FileText, Loader2, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import "./DocumentCard.scss";

const STATUS_LABEL = {
  READY: "Sẵn sàng",
  PROCESSING: "Đang xử lý",
  UPLOADED: "Đã tải lên",
  FAILED: "Lỗi xử lý",
};

function StatusIcon({ status }) {
  if (status === "READY") return <CheckCircle2 size={13} />;
  if (status === "FAILED") return <AlertCircle size={13} />;
  return <Loader2 size={13} className="document-card__spin" />;
}

function DocumentCard({ document: doc, onClick, onDelete }) {
  const clickable = doc.status === "READY" && typeof onClick === "function";

  return (
    <div
      className={`document-card${clickable ? " document-card--clickable" : ""}`}
      onClick={clickable ? () => onClick(doc) : undefined}
    >
      <div className="document-card__icon">
        <FileText size={20} />
      </div>

      <div className="document-card__body">
        <p className="document-card__filename" title={doc.filename}>
          {doc.filename}
        </p>

        <span
          className={`document-card__status document-card__status--${doc.status?.toLowerCase()}`}
        >
          <StatusIcon status={doc.status} />
          {STATUS_LABEL[doc.status] ?? doc.status}
        </span>

        <p className="document-card__meta">
          {doc.pageCount ? `${doc.pageCount} trang` : "—"}
          {doc.createdAt ? ` · ${new Date(doc.createdAt).toLocaleDateString("vi-VN")}` : ""}
        </p>
      </div>

      {onDelete && (
        <button
          className="document-card__delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(doc);
          }}
          aria-label="Xóa tài liệu"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

export default DocumentCard;
