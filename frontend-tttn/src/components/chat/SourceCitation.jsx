import "./SourceCitation.scss";

function SourceCitation({ pages }) {
  if (!pages || pages.length === 0) return null;

  return (
    <div className="source-citation">
      <span className="source-citation__label">Nguồn:</span>
      {pages.map((p) => (
        <span key={p} className="source-citation__pill">
          Trang {p}
        </span>
      ))}
    </div>
  );
}

export default SourceCitation;
