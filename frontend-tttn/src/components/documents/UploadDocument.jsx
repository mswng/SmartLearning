import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import "./UploadDocument.scss";

function UploadDocument({ onUpload, uploading = false }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Chỉ hỗ trợ file PDF.");
      return;
    }
    setError(null);
    onUpload(file);
  };

  return (
    <div className="upload-document">
      <div
        className={`upload-document__dropzone${
          dragActive ? " upload-document__dropzone--active" : ""
        }`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
      >
        <UploadCloud size={28} />
        <p className="upload-document__text">
          {uploading
            ? "Đang tải lên và xử lý PDF, có thể mất một chút thời gian..."
            : "Kéo thả file PDF vào đây, hoặc bấm để chọn file"}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        hidden
        disabled={uploading}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className="upload-document__error">{error}</p>}
    </div>
  );
}

export default UploadDocument;
