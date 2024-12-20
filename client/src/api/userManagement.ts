import api from "./Api";
import { handleTokenExpiration } from "./utils"; // Import the common function

// Get Users List with Role
export const getManagementUsers = () => {
  const token = localStorage.getItem("token"); // Retrieve token from local storage
  return api
    .get("/users", {
      headers: {
        Authorization: `Bearer ${token}`, // Include token in headers
      },
    })
    .then((response) => {
      console.log("Successfully fetched users:", response.data);
      return response.data;
    })
    .catch((error) => {
      console.error("Error fetching users:", error);
      handleTokenExpiration(error); // Use the common function
      throw error;
    });
};

// Update User Role
export const updateUserRole = (userId: string, role: string) => {
  console.log(`Updating user role for userId: ${userId} to role: ${role}`);
  const token = localStorage.getItem("token"); // Retrieve token from local storage
  return api
    .put(
      `/users/${userId}/role`,
      { role },
      {
        headers: {
          Authorization: `Bearer ${token}`, // Include token in headers
        },
      }
    )
    .then((response) => {
      console.log("Successfully updated user role:", response.data);
      return response.data;
    })
    .catch((error) => {
      console.error("Error updating user role:", error);
      handleTokenExpiration(error); // Use the common function
      throw error;
    });
};

// Delete User
export const deleteUser = (userId: string) => {
  console.log(`Deleting user with userId: ${userId}`);
  const token = localStorage.getItem("token"); // Retrieve token from local storage
  return api
    .delete(`/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`, // Include token in headers
      },
    })
    .then((response) => {
      console.log("Successfully deleted user:", response.data);
      return response.data;
    })
    .catch((error) => {
      console.error("Error deleting user:", error);
      handleTokenExpiration(error); // Use the common function
      throw error;
    });
};

// Bulk Update User Roles
export const bulkUpdateUserRoles = (
  updates: Array<{ userId: string; role: string }>
) => {
  console.log("Bulk updating user roles:", updates);
  const promises = updates.map((update) =>
    updateUserRole(update.userId, update.role)
  );
  return Promise.all(promises)
    .then(() => {
      console.log("Successfully updated user roles in bulk");
      return { success: true, message: "User roles updated successfully" };
    })
    .catch((error) => {
      console.error("Error in bulk updating user roles:", error);
      handleTokenExpiration(error); // Use the common function
      throw error;
    });
};

// Bulk Delete Users
export const bulkDeleteUsers = (userIds: string[]) => {
  console.log("Bulk deleting users with userIds:", userIds);
  const promises = userIds.map((userId) => deleteUser(userId));
  return Promise.all(promises)
    .then(() => {
      console.log("Successfully deleted users in bulk");
      return { success: true, message: "Users deleted successfully" };
    })
    .catch((error) => {
      console.error("Error in bulk deleting users:", error);
      handleTokenExpiration(error); // Use the common function
      throw error;
    });
};
