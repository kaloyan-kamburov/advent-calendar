import { FormEvent, useState } from "react";
import { useAuth } from "../../AuthContext";
import { Navigate } from "react-router-dom";

const Login = () => {
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // Call Firebase's signInWithEmailAndPassword function
      const userCredential = await login(email, password);
      console.log("User signed in:", userCredential.user);
    } catch (error) {
      alert(error);
      console.error("Error signing in with email and password:", error);
    }
  };

  if (loading) return null; // or a loading spinner if you prefer

  return user ? (
    <Navigate to={"/people"} />
  ) : (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {/* {error && <p style={{ color: "red" }}>{error}</p>} */}
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
};

export default Login;
