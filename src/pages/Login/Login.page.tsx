import { useAuth } from "../../AuthContext";
import { Navigate } from "react-router-dom";

const Login = () => {
  const { login, user, loading } = useAuth();

  if (loading) return null; // or a loading spinner if you prefer

  return user ? (
    <Navigate to={"/people"} />
  ) : (
    <div>
      <h1>Login</h1>
      <button onClick={login}>Login with Google</button>
    </div>
  );
};

export default Login;
