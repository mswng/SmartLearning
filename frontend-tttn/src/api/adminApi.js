import { apiFetch } from "./apiClient.js";

// Các hàm này gọi /api/admin/**, backend yêu cầu role ADMIN (JWT có
// role=ADMIN mới gọi được, nếu không sẽ nhận lỗi 403). Đăng nhập admin
// qua adminLogin() ở authApi.js sẽ có JWT với role phù hợp.

export function getDashboardStats() {
  return apiFetch("/api/admin/dashboard");
}

export function listUsers() {
  return apiFetch("/api/admin/users");
}

export function createUser(user) {
  return apiFetch("/api/admin/users", { method: "POST", body: user });
}

export function updateUser(id, user) {
  return apiFetch(`/api/admin/users/${id}`, { method: "PUT", body: user });
}

export function deleteUser(id) {
  return apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
}
