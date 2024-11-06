/* eslint-disable no-useless-escape */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
// AuthContext.js
import { createContext, useContext, useEffect, useState, FC } from "react";
import { auth, onAuthStateChanged, signInWithEmailAndPassword } from "./config";

const AuthContext = createContext<any>(undefined);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: FC<any> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true); // New loading state

  const login = (user: string = "", email: string = "") =>
    signInWithEmailAndPassword(auth, user, email).catch((error) => alert(error.message));

  const logout = () => auth.signOut();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false); // Set loading to false once auth state is determined
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
