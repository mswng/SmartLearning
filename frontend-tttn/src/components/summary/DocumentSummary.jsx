import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { summaryApi } from "~/api/index.js";
import Button from "~/components/common/Button.jsx";
import Loading from "~/components/common/Loading.jsx";

function DocumentSummary({ documentId, active, onError }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(null);

  // Changing document unmounts this keyed component. Ignore its late response.
  useEffect(() => () => {
    requestRef.current = null;
  }, []);

  const handleSummarize = async () => {
    // Synchronous guard also covers clicks before React commits loading state.
    if (requestRef.current) return;
    const request = {};
    requestRef.current = request;
    setLoading(true);
    onError(null);
    try {
      const newSummary = await summaryApi.getDocumentSummary(documentId, false);
      if (requestRef.current === request) setSummary(newSummary);
    } catch (error) {
      if (requestRef.current === request) onError(error.message);
    } finally {
      if (requestRef.current === request) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  };

  // Keep state across tab switches without generating another request.
  if (!active) return null;

  return (
    <div>
      {!summary && !loading && (
        <Button onClick={handleSummarize}>
          <Sparkles size={16} /> Tạo tóm tắt bằng AI
        </Button>
      )}
      {loading && <Loading label="Đang tóm tắt tài liệu..." />}
      {summary && (
        <>
          <div className="document-detail-page__summary-text">
            <ReactMarkdown>{summary.overallSummary}</ReactMarkdown>
          </div>
          <Button variant="secondary" onClick={handleSummarize} loading={loading}>
            Tóm tắt lại
          </Button>
        </>
      )}
    </div>
  );
}

export default DocumentSummary;
