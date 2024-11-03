import { useAuth } from "../../AuthContext";
import { Navigate, useLocation } from "react-router-dom";

const Login = () => {
  const { login, user, loading } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  if (loading) return null; // or a loading spinner if you prefer

  return user ? (
    <Navigate to={from} />
  ) : (
    <div>
      <h1>Login</h1>
      <button onClick={login}>Login with Google</button>
    </div>
  );
};

export default Login;
