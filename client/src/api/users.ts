import api from "./Api";
import { handleTokenExpiration } from "./utils.ts"; // Import the common function

// Get Users List
// GET /users
// Response: { users: Array<{ id: string, fullName: string, email: string, department: string, designation: string }> }
export const getUsers = async () => {
  try {
    const token = localStorage.getItem("token"); // Retrieve token from local storage
    const response = await api.get("/users", {
      headers: {
        Authorization: `Bearer ${token}`, // Include token in headers
      },
    });
    console.log("Successfully fetched users from API:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching users from API:", error.message, error.stack);
    handleTokenExpiration(error); // Use the common function
    throw error;
  }
};
