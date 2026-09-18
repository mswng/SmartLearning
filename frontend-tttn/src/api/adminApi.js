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

// Theo yêu cầu quản lý user: CHỈ khóa/mở khóa tài khoản + tạo admin mới —
// không sửa/xóa tự do (updateUser/deleteUser vẫn tồn tại bên backend
// nhưng không được dùng ở giao diện admin để giữ đúng phạm vi quyền hạn).
export function setUserEnabled(id, enabled) {
  return apiFetch(`/api/admin/users/${id}/enabled`, {
    method: "PATCH",
    body: { enabled },
  });
}

export function createAdmin(admin) {
  return apiFetch("/api/admin/users/admin", { method: "POST", body: admin });
}

// Tài liệu + số quiz/câu hỏi phát sinh — chỉ metadata, KHÔNG có nội dung
// PDF (backend cố tình không bao giờ trả về nội dung cho admin).
export function listAllDocuments(userId) {
  const query = userId ? `?userId=${userId}` : "";
  return apiFetch(`/api/admin/documents${query}`);
}

export function deleteDocumentAsAdmin(documentId) {
  return apiFetch(`/api/admin/documents/${documentId}`, { method: "DELETE" });
}
