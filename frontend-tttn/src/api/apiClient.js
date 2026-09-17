import { API_BASE_URL } from "~/utils/constants.js";
import { getToken, clearAuth } from "~/services/storageService.js";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Gọi API backend, tự đính kèm JWT (nếu có) và parse lỗi theo đúng shape
 * mà GlobalExceptionHandler bên backend trả về: { "error": "..." } hoặc
 * { "fieldA": "message", ... } cho lỗi validation.
 *
 * @param {string} path - đường dẫn API, ví dụ "/api/documents"
 * @param {object} options
 * @param {string} [options.method]
 * @param {object} [options.body] - object thường -> tự JSON.stringify
 * @param {FormData} [options.formData] - dùng cho upload file (multipart)
 * @param {boolean} [options.auth=true] - có đính kèm Authorization header không
 */
export async function apiFetch(path, { method = "GET", body, formData, auth = true } = {}) {
  const headers = {};
  const init = { method, headers };

  if (formData) {
    init.body = formData; // để trình duyệt tự set Content-Type multipart + boundary
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  if (auth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    throw new ApiError(
      "Không kết nối được tới server. Kiểm tra backend đã chạy ở " + API_BASE_URL + " chưa.",
      0
    );
  }

  // 204 No Content — không có body để parse
  if (response.status === 204) {
    return null;
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    // Token hết hạn / không hợp lệ -> dọn phiên đăng nhập cũ
    if (response.status === 401) {
      clearAuth();
    }

    const message =
      (payload && typeof payload === "object" && (payload.error || Object.values(payload)[0])) ||
      (typeof payload === "string" && payload) ||
      `Lỗi ${response.status}`;

    throw new ApiError(message, response.status);
  }

  return payload;
}

export function googleLoginUrl() {
  return `${API_BASE_URL}/oauth2/authorization/google`;
}
