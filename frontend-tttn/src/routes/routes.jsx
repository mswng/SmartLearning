import DashboardPage from "~/page/DashboardPage.jsx";
import LoginPage from "~/page/auth/LoginPage.jsx";
import OAuthRedirect from "~/page/auth/OAuthRedirect.jsx";
import DocumentsPage from "~/page/DocumentsPage.jsx";
import DocumentDetailPage from "~/page/DocumentDetailPage.jsx";
import HistoryPage from "~/page/HistoryPage.jsx";
import SearchPage from "~/page/SearchPage.jsx";

// layout: null -> render KHÔNG có Header/Sidebar (dùng cho trang login,
// trang trung gian OAuth redirect). Không set layout -> mặc định bọc
// DefaultLayout (xem AppRoute.jsx).
const publicRoute = [
  { path: "/login", element: <LoginPage />, layout: null },
  { path: "/oauth2/redirect", element: <OAuthRedirect />, layout: null },
];

// Mọi route ở đây đều yêu cầu đã đăng nhập (JWT hợp lệ) — xem PrivateRoute.jsx.
const privateRoute = [
  { path: "/", element: <DashboardPage /> },
  { path: "/documents", element: <DocumentsPage /> },
  { path: "/document/:documentId", element: <DocumentDetailPage /> },
  { path: "/search", element: <SearchPage /> },
  { path: "/history", element: <HistoryPage /> },
];

export { publicRoute, privateRoute };
