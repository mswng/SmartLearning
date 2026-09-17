import "./Loading.scss";

function Loading({ label = "Đang tải..." }) {
  return (
    <div className="loading">
      <div className="loading__spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export default Loading;
