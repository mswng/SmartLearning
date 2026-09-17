import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain } from "lucide-react";

import { authApi, googleLoginUrl } from "~/api/index.js";
import { useAuth } from "~/context/AuthContext.jsx";
import "./LoginPage.scss";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Đăng nhập truyền thống — chỉ dùng cho tài khoản ADMIN (xem
  // UserService.adminLogin bên backend, user thường phải đăng nhập Google).
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.adminLogin(username, password);
      login(res.token, { name: res.name, email: res.email, role: res.role });
      navigate("/", { replace: true });
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__card">
        <div className="login-page__logo">
          <Brain size={24} />
          <span>SmartLearning</span>
        </div>

        <p className="login-page__subtitle">Học cùng AI, trò chuyện với tài liệu PDF</p>

        {/* Không phải API call — chuyển hướng thẳng trình duyệt sang
            backend, backend redirect tiếp sang Google rồi quay lại
            /oauth2/redirect kèm JWT (xem OAuthRedirect.jsx). */}
        <a className="login-page__google-btn" href={googleLoginUrl()}>
          Đăng nhập với Google
        </a>

        <div className="login-page__divider">hoặc đăng nhập quản trị</div>

        <form className="login-page__form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="login-page__error">{error}</p>}

          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
