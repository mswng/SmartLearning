import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getToken, getUser, setToken, setUser as persistUser, clearAuth } from "~/services/storageService.js";
import { getCurrentUser } from "~/api/authApi.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getUser());
  const [loading, setLoading] = useState(true);

  // Khi app khởi động: nếu có token cũ trong localStorage, xác thực lại
  // với backend (phòng trường hợp token hết hạn/bị thu hồi) thay vì tin
  // mù vào dữ liệu user cũ đã lưu.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then((me) => {
        setUser(me);
        persistUser(me);
      })
      .catch(() => {
        clearAuth();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Dùng sau khi: (a) admin login trả về {token, name, email, role}, hoặc
  // (b) OAuthRedirect đọc token từ URL rồi tự gọi getCurrentUser().
  const login = useCallback((token, userInfo) => {
    setToken(token);
    persistUser(userInfo);
    setUser(userInfo);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === "ADMIN",
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() phải được gọi bên trong <AuthProvider>");
  }
  return ctx;
}
