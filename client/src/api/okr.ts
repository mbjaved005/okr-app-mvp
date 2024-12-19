import api from "./Api";
import { handleTokenExpiration } from "./utils"; // Import the common function

// Function to fetch OKRs with authorization header
export const getOKRs = async () => {
  const token = localStorage.getItem("token");
  try {
    const response = await api.get("/okrs", {
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the headers
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching OKRs:", error);
    handleTokenExpiration(error); // Use the common function
    throw error;
  }
};

// Get OKR by ID
// GET /okrs/:id
// Response: { okr: Object }
export const getOKRById = async (id: string) => {
  const token = localStorage.getItem("token");
  try {
    const response = await api.get(`/okrs/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the headers
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching OKR by ID:", error);
    handleTokenExpiration(error);
    throw error;
  }
};

// Create OKR
// POST /okrs
// Request: { title: string, description: string, startDate: string, endDate: string, category: string, department: string, owners: string[], keyResults: Array<{ title: string, currentValue: number, targetValue: number }> }
// Response: { success: boolean, okr: Object }
export const createOKR = async (data: any) => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user"); // Assuming the user ID is stored in localStorage

  try {
    const response = await api.post(
      "/okrs/create-okr",
      {
        // Updated endpoint
        ...data,
        createdBy: JSON.parse(user || "{}").id, // Include the createdBy field with user ID
        category: capitalizeCategory(data.category), // Ensure category is capitalized correctly
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the headers
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating OKR:", error);
    handleTokenExpiration(error);
    throw error;
  }
};

// Update OKR
// PUT /okrs/:id
// Request: { title: string, description: string, startDate: string, endDate: string, category: string, department: string, owners: string[], keyResults: Array<{ id?: string, title: string, currentValue: number, targetValue: number }> }
// Response: { success: boolean, okr: Object }
export const updateOKR = async (id: string, data: any) => {
  const token = localStorage.getItem("token");
  try {
    const response = await api.put(
      `/okrs/${id}`,
      {
        ...data,
        category: capitalizeCategory(data.category), // Ensure category is capitalized correctly
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the headers
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating OKR:", error);
    handleTokenExpiration(error);
    throw error;
  }
};

// Delete OKR
// DELETE /okrs/:id
// Response: { success: boolean }
export const deleteOKR = async (id: string) => {
  const token = localStorage.getItem("token");
  try {
    const response = await api.delete(`/okrs/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`, // Include the token in the headers
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting OKR:", error);
    handleTokenExpiration(error); // Use the common function
    throw error;
  }
};

const calculateOKRProgress = (keyResults: any[]) => {
  if (!keyResults.length) return 0;
  const totalProgress = keyResults.reduce(
    (sum, kr) => sum + (kr.currentValue / kr.targetValue) * 100,
    0
  );
  return Math.round(totalProgress / keyResults.length);
};

const getOKRStatus = (progress: number) => {
  if (progress === 0) return "Not Started";
  if (progress === 100) return "Completed";
  return "In Progress";
};

// Helper function to capitalize the category
const capitalizeCategory = (category: string) => {
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
};
