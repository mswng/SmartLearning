import { Navigate } from "react-router-dom";
import { useAuth } from "~/context/AuthContext.jsx";
import Loading from "~/components/common/Loading.jsx";

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <Loading label="Đang xác thực..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
