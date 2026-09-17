import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "~/context/AuthContext.jsx";
import { getCurrentUser } from "~/api/authApi.js";
import { setToken as persistToken } from "~/services/storageService.js";
import Loading from "~/components/common/Loading.jsx";

// Backend (OAuth2LoginSuccessHandler) redirect trình duyệt về đây sau khi
// đăng nhập Google thành công, kèm JWT trên query string:
//   http://localhost:3000/oauth2/redirect?token=eyJ...
function OAuthRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState(null);
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return; // StrictMode gọi effect 2 lần lúc dev
    ranOnce.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setError("Không nhận được token đăng nhập từ Google.");
      return;
    }

    // Cần lưu token trước, vì getCurrentUser() đọc token từ storage để
    // gắn vào header Authorization.
    persistToken(token);

    getCurrentUser()
      .then((me) => {
        login(token, me);
        navigate("/", { replace: true });
      })
      .catch(() => {
        setError("Đăng nhập Google thất bại. Vui lòng thử lại.");
      });
  }, [searchParams, login, navigate]);

  if (error) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <p>{error}</p>
        <button onClick={() => navigate("/login", { replace: true })}>
          Quay lại trang đăng nhập
        </button>
      </div>
    );
  }

  return <Loading label="Đang hoàn tất đăng nhập..." />;
}

export default OAuthRedirect;
