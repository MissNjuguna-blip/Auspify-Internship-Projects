
import {
  createContext,
  useCallback,
  useEffect,
  useState,
  useContext,
} from "react";

import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [token, setToken] = useState(
    () => localStorage.getItem("access_token") || ""
  );

  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Could not load user:", error);
      return null;
    }
  });

  // LOGOUT
  const Logout = useCallback(() => {
    console.log("Logging out...");

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");

    setToken("");
    setUser(null);

    navigate("/login", { replace: true });
  }, [navigate]);

  // CHECK TOKEN
  useEffect(() => {
    if (!token) return;

    try {
      const decodedToken = jwtDecode(token);

      const isExpired =
        decodedToken.exp * 1000 < Date.now();

      if (isExpired) {
        console.log("Access token has expired.");
        Logout();
      }
    } catch (error) {
      console.error("Invalid JWT token:", error);
      Logout();
    }
  }, [token, Logout]);

  // SAVE TOKEN
  useEffect(() => {
    if (token) {
      localStorage.setItem("access_token", token);
    } else {
      localStorage.removeItem("access_token");
    }
  }, [token]);

  // SAVE USER
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        token,
        setToken,
        user,
        setUser,
        Logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
