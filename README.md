# 🎓 Smart Learning

**Smart Learning** là nền tảng học tập thông minh ứng dụng **Artificial Intelligence (AI)** và **Retrieval-Augmented Generation (RAG)**, hỗ trợ người dùng khai thác kiến thức trực tiếp từ tài liệu học tập PDF.

Hệ thống cho phép người dùng tải tài liệu lên, tìm kiếm nội dung theo ngữ nghĩa, đặt câu hỏi với AI, tóm tắt tài liệu và tạo Quiz phục vụ quá trình học tập và ôn luyện.

---

## ✨ Chức năng chính

- Đăng nhập bằng Google OAuth2
- Upload và quản lý tài liệu PDF
- Trích xuất và xử lý nội dung tài liệu
- Semantic Search
- AI Chat dựa trên tài liệu bằng RAG
- Hiển thị nguồn/trang tham khảo của câu trả lời
- Tóm tắt tài liệu bằng AI
- Tạo Quiz tự động từ nội dung tài liệu
- Lưu lịch sử hội thoại
- Dashboard tổng quan

---

## 🏗️ Kiến trúc hệ thống

Smart Learning được xây dựng theo mô hình **Client – Server** kết hợp với một **AI Service độc lập**.

### Frontend

- React
- React Router
- Axios
- SCSS

### Backend

- Java
- Spring Boot
- REST API
- Spring Security
- JWT Authentication
- Google OAuth2
- JPA / Hibernate

### Database

- MySQL

### AI Service

- Python
- FastAPI
- PyMuPDF
- Sentence Transformers
- FAISS
- Retrieval-Augmented Generation (RAG)
- Gemini API


# 🚀 Cài đặt và chạy dự án

## 1. Yêu cầu môi trường

Cần cài đặt:

- Java 17+
- Maven
- Python 3.10+
- Node.js
- npm
- MySQL
- Git

---

## 2. Clone Repository

```bash
git clone https://github.com/mswng/SmartLearning.git
cd smart-learning
```

---

# 🗄️ Cấu hình Database

## 3. Tạo MySQL Database

Khởi động MySQL và tạo database:

```sql
CREATE DATABASE smart_learning;
```

Cấu hình kết nối trong Spring Boot:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/smart_learning
spring.datasource.username=root
spring.datasource.password=your_password

spring.jpa.hibernate.ddl-auto=update
```

Hibernate sẽ tự động tạo hoặc cập nhật các bảng cần thiết khi Backend khởi động.

Các bảng chính gồm:

```text
users
documents
conversations
messages
quizzes
quiz_questions
```

---

# ☕ Backend – Spring Boot

## 4. Cài đặt và chạy Backend

Di chuyển vào thư mục Backend:

```bash
cd backend
```

Chạy project:

```bash
mvn spring-boot:run
```

Backend mặc định chạy tại:

```text
http://localhost:8080
```

Backend chịu trách nhiệm:

- Authentication
- JWT
- Google OAuth2
- User Management
- Document Management
- Conversation History
- Quiz Management
- Kết nối MySQL
- Kết nối AI Service

---

# 🤖 AI Service – FastAPI

AI Service được xây dựng bằng **Python và FastAPI**, chịu trách nhiệm xử lý các chức năng AI của hệ thống:

- Trích xuất nội dung PDF
- Tiền xử lý văn bản
- Chunking
- Tạo Embedding
- FAISS Vector Search
- Semantic Search
- RAG Chat
- Tóm tắt tài liệu
- Tạo Quiz

Các thư viện và công nghệ chính:

- Python
- FastAPI
- PyMuPDF
- Sentence Transformers
- FAISS
- Gemini API

---

## 4. Cài đặt và chạy AI service

Di chuyển vào thư mục pdf-Service:

```bash
cd pdf-service
```

### Windows

Chạy:

```bat
.\run.bat
```

### macOS / Linux

Cấp quyền thực thi cho script nếu cần:

```bash
chmod +x run.sh
```

Sau đó chạy:

```bash
./run.sh
```

Script sẽ tự động thực hiện các bước cần thiết để khởi động AI Service.

AI Service mặc định chạy tại:

```text
http://localhost:8001
```

## 🧠 Embedding Model

Hệ thống sử dụng **Sentence Transformers** để tạo vector Embedding cho nội dung tài liệu và câu truy vấn.

Project được cấu hình với:

```text
all-MiniLM-L6-v2
```

model sẽ được Sentence Transformers tự động tải về trong lần chạy đầu tiên.

Không cần tải model thủ công.

Embedding được sử dụng cho:

- Document Chunk Embedding
- Query Embedding
- Semantic Search
- RAG Retrieval

Các vector sau khi được tạo sẽ được lập chỉ mục và tìm kiếm bằng **FAISS**.

---

## ✨ Cấu hình LLM – Gemini

Smart Learning sử dụng **Gemini** làm Large Language Model (LLM).

Gemini được sử dụng thông qua API nên **không cần tải mô hình LLM trực tiếp về máy**.

Tạo file `.env` trong thư mục AI Service và cấu hình:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_gemini_model
```

> ⚠️ Không commit file `.env` hoặc Gemini API Key lên Git repository.

---


# ⚛️ Frontend – React

## 9. Cài đặt Frontend

Di chuyển vào thư mục Frontend:

```bash
cd frontend
```

Cài dependencies:

```bash
npm install
```

Chạy development server:

```bash
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:5173
```

---

# ▶️ Thứ tự chạy hệ thống

Khởi động các thành phần theo thứ tự:

```text
1. MySQL
      ↓
2. Spring Boot Backend
      ↓
3. FastAPI AI Service
      ↓
4. React Frontend
```

Sau đó truy cập:

```text
http://localhost:5173
```

---

# 🔐 Environment Variables

Các thông tin nhạy cảm không nên được commit lên repository.

Ví dụ:

```env
GEMINI_API_KEY=your_api_key
```

Đảm bảo `.gitignore` có:

```gitignore
# Environment
.env

# Python
venv/
.venv/
__pycache__/
*.pyc

# React
node_modules/
dist/

# Spring Boot
target/

# IDE
.idea/
.vscode/
```

---

# 🎯 Mục tiêu dự án

Smart Learning hướng đến việc xây dựng một nền tảng hỗ trợ người học khai thác tài liệu hiệu quả hơn bằng AI.

Thay vì phải đọc và tìm kiếm thủ công trong toàn bộ tài liệu, người dùng có thể sử dụng Semantic Search và RAG để nhanh chóng tìm kiếm, hỏi đáp và tổng hợp kiến thức từ chính tài liệu của mình.

Hệ thống đồng thời cung cấp các công cụ hỗ trợ học tập như tóm tắt và Quiz nhằm giúp quá trình học và ôn tập trở nên thuận tiện hơn.

---

## 📌 Project

**Smart Learning – Nền tảng học tập thông minh ứng dụng AI và Retrieval-Augmented Generation (RAG)**