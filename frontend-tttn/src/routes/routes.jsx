import { Navigate } from "react-router-dom";

import DashboardPage from "~/page/DashboardPage.jsx";
import LoginPage from "~/page/auth/LoginPage.jsx";
import OAuthRedirect from "~/page/auth/OAuthRedirect.jsx";
import DocumentsPage from "~/page/DocumentsPage.jsx";
import DocumentDetailPage from "~/page/DocumentDetailPage.jsx";
import HistoryPage from "~/page/HistoryPage.jsx";
import SearchPage from "~/page/SearchPage.jsx";

import AdminDashboardPage from "~/page/admin/AdminDashboardPage.jsx";
import AdminUsersPage from "~/page/admin/AdminUsersPage.jsx";
import AdminDocumentsPage from "~/page/admin/AdminDocumentsPage.jsx";

import { useAuth } from "~/context/AuthContext.jsx";

function HomeRedirect() {
  const { isAdmin } = useAuth();
  return isAdmin ? <Navigate to="/admin" replace /> : <DashboardPage />;
}

const publicRoute = [
  { path: "/login", element: <LoginPage />, layout: null },
  { path: "/oauth2/redirect", element: <OAuthRedirect />, layout: null },
];

const privateRoute = [
  { path: "/", element: <HomeRedirect /> },
  { path: "/documents", element: <DocumentsPage /> },
  { path: "/document/:documentId", element: <DocumentDetailPage /> },
  { path: "/search", element: <SearchPage /> },
  { path: "/history", element: <HistoryPage /> },
];

const adminRoute = [
  { path: "/admin", element: <AdminDashboardPage /> },
  { path: "/admin/users", element: <AdminUsersPage /> },
  { path: "/admin/documents", element: <AdminDocumentsPage /> },
];

export { publicRoute, privateRoute, adminRoute };
