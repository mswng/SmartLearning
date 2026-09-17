import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 48, margin: 0, color: "#111827" }}>404</h1>
      <p style={{ color: "#6b7280", margin: 0 }}>Không tìm thấy trang bạn yêu cầu.</p>
      <Link to="/" style={{ color: "#4f46e5", fontWeight: 600 }}>
        Về trang chủ
      </Link>
    </div>
  );
}

export default NotFoundPage;
