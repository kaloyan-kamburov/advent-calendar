import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";

function loginErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "That email or password is incorrect.";
  }
  if (code === "auth/too-many-requests") return "Too many attempts. Wait a moment and try again.";
  if (code === "auth/invalid-email") return "Enter a valid email address.";
  return "Could not sign in. Try again.";
}

const Login = () => {
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (loginError) {
      setError(loginErrorMessage(loginError));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-shell">
        <div className="admin-loading">Loading…</div>
      </div>
    );
  }

  if (user) return <Navigate to="/people" />;

  return (
    <div className="admin-shell gate">
      <form className="gate-card" onSubmit={handleLogin}>
        <p className="eyebrow">Advent Calendar</p>
        <h1>Sign in</h1>
        <p className="gate-copy muted">Write and share each person’s calendar.</p>
        <label className="field" htmlFor="email">
          Email
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="field" htmlFor="password">
          Password
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
};

export default Login;
