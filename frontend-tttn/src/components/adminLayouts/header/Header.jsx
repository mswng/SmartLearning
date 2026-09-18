import { NavLink, useNavigate } from "react-router-dom";
import { Brain, LogOut } from "lucide-react";

import { useAuth } from "~/context/AuthContext.jsx";
import { authApi } from "~/api/index.js";

import "./Header.scss";

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // JWT stateless: vẫn logout phía client nếu API logout thất bại
    }

    logout();
    navigate("/login", { replace: true });
  };

  // Hỗ trợ nhiều tên field nếu login thường và Google login
  // đang trả object hơi khác nhau.
  const displayName =
    user?.name ||
    user?.fullName ||
    user?.email ||
    "User";

  const avatarUrl =
    user?.picture ||
    user?.avatarUrl ||
    user?.avatar ||
    user?.imageUrl ||
    null;

  const initial =
    displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="header">
      <div className="header__logo">
        <NavLink to="/" className="header__logo-link">
          <Brain size={28} />
          <span>SmartLearning</span>
        </NavLink>
      </div>

      <div className="header__right">
        <span className="header__username">
          {displayName}
        </span>

        <div className="header__avatar">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${displayName} avatar`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span>{initial}</span>
          )}
        </div>

        <button
          type="button"
          className="header__logout"
          onClick={handleLogout}
          title="Đăng xuất"
          aria-label="Đăng xuất"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

export default Header;