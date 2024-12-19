import api from "./Api";
import { handleTokenExpiration } from "./utils"; // Import the common function

// Login
// POST /auth/login
// Request: { email: string, password: string }
// Response: { token: string, user: { id: string, name: string, email: string, role: string, profilePicture?: string } }
export const login = async (email: string, password: string) => {
  console.log("Attempting to login user:", { email });
  try {
    console.log("Sending login request to:", "/auth/login");
    const response = await api.post("/auth/login", { email, password });
    console.log("Login API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Register
// POST /auth/register
// Request: { name: string, email: string, password: string, role: string, designation: string, profilePicture?: File }
// Response: { success: boolean, message: string, user: { id: string, name: string, email: string, role: string, profilePicture?: string } }
export const register = async (data: {
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
  designation: string;
  profilePicture?: File;
}) => {
  console.log("Attempting to register user:", data);
  try {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("role", data.role);
    formData.append("designation", data.designation);
    formData.append("department", data.department);
    if (data.profilePicture) {
      formData.append("profilePicture", data.profilePicture);
    }
    console.log("Sending registration request to:", "/auth/register");
    const response = await api.post("/auth/register", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("Registration response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

// Logout
// POST /auth/logout
// Response: { success: boolean }
export const logout = async () => {
  console.log("Attempting to logout user");
  try {
    console.log("Sending logout request to:", "/auth/logout");
    const response = await api.post("/auth/logout");
    console.log("Logout response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

// Get current user
// GET /auth/me
// Response: { id: string, name: string, email: string, role: string, profilePicture?: string }
export const getCurrentUser = async () => {
  console.log("Fetching current user data");
  try {
    const response = await api.get("/auth/me");
    console.log("Current user data:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching current user:", error);
    handleTokenExpiration(error);
    throw error;
  }
};

// Update User Profile
// PUT /auth/update-profile
// Request: { name: string, email: string, department: string, designation: string, role: string }
// Response: { success: boolean, user: User }
export const updateProfile = async (data: {
  name: string;
  email: string;
  department: string;
  designation: string;
  role: string;
}) => {
  console.log("Attempting to update user profile:", data);
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }
    console.log("Token being sent for profile update:", token);
    console.log("Sending update profile request to:", "/auth/update-profile");
    const response = await api.put("/auth/update-profile", data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("Update profile response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Update profile error:", error);
    handleTokenExpiration(error);
    throw error;
  }
};
