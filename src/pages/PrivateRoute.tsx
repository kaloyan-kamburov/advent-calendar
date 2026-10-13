/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

const PrivateRoute: FC<any> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="admin-shell">
        <div className="admin-loading">Loading…</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" state={{ from: location }} />;
};

export default PrivateRoute;
