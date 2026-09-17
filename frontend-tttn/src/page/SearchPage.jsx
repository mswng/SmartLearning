import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { documentApi, searchApi } from "~/api/index.js";
import Loading from "~/components/common/Loading.jsx";
import "./SearchPage.scss";

function SearchPage() {
  const [documents, setDocuments] = useState([]);
  const [documentId, setDocumentId] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    documentApi
      .listDocuments()
      .then((docs) => {
        // chỉ tài liệu READY mới có FAISS index để tìm kiếm
        const ready = docs.filter((d) => d.status === "READY");
        setDocuments(ready);
        if (ready.length > 0) setDocumentId(String(ready[0].id));
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!documentId || !query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await searchApi.semanticSearch(documentId, query.trim(), 5);
      setResults(res);
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-page">
      <h1 className="search-page__title">Tìm kiếm ngữ nghĩa</h1>
      <p className="search-page__subtitle">
        Tìm những đoạn văn liên quan nhất trong tài liệu, kèm số trang nguồn.
      </p>

      <form className="search-page__form" onSubmit={handleSubmit}>
        <select value={documentId} onChange={(e) => setDocumentId(e.target.value)}>
          {documents.length === 0 && <option value="">Chưa có tài liệu sẵn sàng</option>}
          {documents.map((d) => (
            <option key={d.id} value={d.id}>
              {d.filename}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Nhập từ khóa hoặc câu hỏi..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <button type="submit" className="btn btn--primary" disabled={loading || !documentId}>
          <Search size={16} />
        </button>
      </form>

      {error && <p className="search-page__error">{error}</p>}

      {loading ? (
        <Loading />
      ) : results ? (
        results.length === 0 ? (
          <p className="search-page__empty">Không tìm thấy kết quả phù hợp.</p>
        ) : (
          <div className="search-page__results">
            {results.map((r, i) => (
              <div key={i} className="search-page__result">
                <span className="search-page__result-page">Trang {r.page}</span>
                <p>{r.text}</p>
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}

export default SearchPage;
