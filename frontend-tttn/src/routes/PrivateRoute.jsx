import { Navigate } from "react-router-dom";
import { useAuth } from "~/context/AuthContext.jsx";
import Loading from "~/components/common/Loading.jsx";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading label="Đang xác thực..." />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
