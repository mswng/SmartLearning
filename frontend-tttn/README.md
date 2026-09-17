# frontend-tttn — SmartLearning UI

React 19 + Vite + React Router 7, gọi thẳng API của backend Spring Boot
(SmartLearning) qua `fetch`.

## Cấu trúc chính

```
src/
├── api/            # 1 file / nhóm API backend (auth, document, chat, search, summary, quiz, admin)
├── components/     # common (Button, Modal, Loading, EmptyState), chat, documents, quiz, layouts
├── context/        # AuthContext — trạng thái đăng nhập toàn app
├── page/           # Dashboard, Documents, DocumentDetail (tab Chat/Tóm tắt/Trắc nghiệm), Search, History, Login
├── routes/         # khai báo route + PrivateRoute (chặn khi chưa đăng nhập)
├── services/        # storageService — lưu JWT/user vào localStorage
└── utils/          # constants.js — API_BASE_URL, enum status/role
```

## Chạy dự án

1. Cài dependency:
   ```bash
   npm install
   ```
2. Copy file env:
   ```bash
   cp .env.example .env
   ```
   Sửa `VITE_API_BASE_URL` nếu backend không chạy ở `http://localhost:8080`.
3. Chạy dev server:
   ```bash
   npm run dev
   ```
   Mặc định Vite chạy ở `http://localhost:5173`.

**Yêu cầu:** backend (Spring Boot, port 8080) và pdf-service (FastAPI, port
8001) phải đang chạy — xem README của dự án backend.

## Đăng nhập

- **Google (user thường):** bấm "Đăng nhập với Google" → redirect sang
  backend → Google → quay lại `/oauth2/redirect?token=...` (frontend tự đọc
  token và lưu). Muốn hoạt động thật cần:
  1. Backend đã cấu hình `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` thật.
  2. Trong `application.yml` (hoặc `application-secret.yml`) của backend,
     `app.oauth2.frontend-redirect-uri` phải trỏ đúng về
     `http://localhost:5173/oauth2/redirect` (đổi port nếu Vite chạy port
     khác).
- **Admin (username/password):** dùng form bên dưới nút Google — mặc định
  `admin` / `admin123` (xem `AdminSeeder` bên backend).

## Ghi chú kỹ thuật

- Toàn bộ gọi API đi qua `src/api/apiClient.js` — tự đính kèm JWT, tự parse
  lỗi theo đúng shape mà `GlobalExceptionHandler` bên backend trả về.
- Alias `~` trỏ tới `src/` (cấu hình trong `vite.config.js`).
- Class CSS theo chuẩn BEM, viết bằng SCSS, mỗi component có 1 file
  `.scss` riêng cạnh file `.jsx`.
- Trang `/document/:documentId` chưa có API `GET` lấy 1 tài liệu riêng lẻ
  bên backend, nên đang lấy tên file/trạng thái bằng cách lọc từ
  `GET /api/documents` (danh sách chung). Nếu sau này backend thêm
  endpoint `GET /api/documents/{id}`, nên đổi qua gọi thẳng cho gọn.
