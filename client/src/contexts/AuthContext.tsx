import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { login as apiLogin, register as apiRegister, updateProfile as apiUpdateProfile } from "@/api/auth";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  designation: string;
  profilePicture?: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: string, designation: string, department: string, profilePicture?: File) => Promise<void>;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const checkAuthStatus = useCallback(async () => {
    const token = localStorage.getItem("token");
    console.log("Checking auth status, token:", token);

    if (token) {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          let parsedUser;
          try {
            parsedUser = JSON.parse(storedUser);
            console.log("Parsed user data from localStorage:", parsedUser);
          } catch (parseError) {
            console.error("Error parsing stored user data:", parseError);
            throw new Error("Invalid user data");
          }
          setUser(parsedUser);
          setIsAuthenticated(true);
          console.log("Auth status checked. User data set in context:", parsedUser);
        } else {
          throw new Error("User data not found");
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setIsAuthenticated(false);
        setUser(null);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
      console.log("No token found, user not authenticated");
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiLogin(email, password);
      if (response.token && response.user) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        setIsAuthenticated(true);
        setUser(response.user);
        console.log("User logged in. User data:", response.user);
        return true;
      } else {
        throw new Error("Login response is missing token or user data");
      }
    } catch (error) {
      console.error("Login error:", error);
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, role: string, designation: string, department: string, profilePicture?: File) => {
    try {
      const response = await apiRegister({ name, email, password, role, designation, department, profilePicture });
      if (response.success) {
        console.log("User registered successfully:", response.user);
        return response;
      } else {
        throw new Error(response.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
    console.log("User logged out");
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await apiUpdateProfile(data);
      if (response.success) {
        const updatedUser = { ...user, ...response.user };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        console.log("User profile updated:", updatedUser);
      } else {
        throw new Error(response.error || "Profile update failed");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout, checkAuthStatus, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}