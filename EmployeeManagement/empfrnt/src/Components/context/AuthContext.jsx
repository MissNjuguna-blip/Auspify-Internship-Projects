import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "./api/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [token, setToken] = useState(
    () => localStorage.getItem("access_token") || ""
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  // LOGOUT
  const Logout = useCallback((redirect = true) => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    setToken("");
    setUser(null);

    if (redirect) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // VALIDATE TOKEN
  useEffect(() => {
    if (!token) return;

    try {
      const decodedToken = jwtDecode(token);

      if (!decodedToken.exp || decodedToken.exp * 1000 <= Date.now()) {
        Logout(false);
      }
    } catch (error) {
      console.error("Invalid JWT:", error);
      Logout(false);
    }
  }, [token, Logout]);

  // SYNCHRONIZE TOKEN
  useEffect(() => {
    if (token) {
      localStorage.setItem("access_token", token);
    } else {
      localStorage.removeItem("access_token");
    }
  }, [token]);

  // SYNCHRONIZE USER
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // LOGIN
const login = useCallback(async (credentials) => {
  try {
    const response = await api.post(
      "core/auth/login/",
      credentials
    );

    const {
      access_token,
      refresh,
      user
    } = response.data;

    // SAVE TOKENS
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh);

    // UPDATE AUTH STATE
    setToken(access_token);
    setUser(user);

    return response.data;

  } catch (error) {
    console.error(
      "Login failed:",
      error.response?.data || error.message
    );

    throw error;
  }
}, []);

  return (
  <AuthContext.Provider
    value={{
      token,
      setToken,
      user,
      setUser,
      login,
      logout: Logout,
      Logout,
      isAuthenticated: !!token,
    }}
  >
    {children}
  </AuthContext.Provider>
);
};

// CUSTOM AUTH HOOK
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }
  return context;
};

export default AuthContext;
