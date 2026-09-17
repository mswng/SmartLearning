import { STORAGE_KEYS } from "~/utils/constants.js";

// Lưu JWT + thông tin user vào localStorage. AuthContext là nơi duy nhất
// nên gọi các hàm setToken/setUser trực tiếp (qua login()/logout()) — chỗ
// khác nên đọc qua useAuth() thay vì đụng thẳng vào storage này.

export function getToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

export function setToken(token) {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
}

export function getUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setUser(user) {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
}
