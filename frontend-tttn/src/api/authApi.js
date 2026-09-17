import { apiFetch } from "./apiClient.js";

// Đăng nhập admin (username/password truyền thống).
// Đăng nhập Google KHÔNG gọi API này — nó là một cú redirect trình duyệt,
// xem googleLoginUrl() trong apiClient.js và trang OAuthRedirect.jsx.
export function adminLogin(username, password) {
  return apiFetch("/api/auth/admin/login", {
    method: "POST",
    body: { username, password },
    auth: false,
  });
}

export function getCurrentUser() {
  return apiFetch("/api/auth/me");
}

export function logout() {
  return apiFetch("/api/auth/logout", { method: "POST" });
}
