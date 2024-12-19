import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Filter, Search, Trash2, Edit2, RotateCcw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import {
  getManagementUsers,
  updateUserRole,
  deleteUser,
  bulkUpdateUserRoles,
  bulkDeleteUsers,
} from "@/api/userManagement";
import { getOKRs } from "@/api/okr";
import { useAuth } from "@/contexts/AuthContext";
import departmentsData from "@/data/departments.json";

type User = {
  id: string;
  fullName: string;
  email: string;
  department: string;
  designation: string;
  role: string;
};

type RoleUpdate = {
  userId: string;
  role: string;
};

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    department: "all",
    designation: "all",
    role: "all",
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [roleUpdates, setRoleUpdates] = useState<RoleUpdate[]>([]);
  const { toast } = useToast();
  const { user: loggedInUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) => {
      const matchesSearch =
        !searchTerm ||
        (user.fullName &&
          user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email &&
          user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.department &&
          user.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.designation &&
          user.designation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.role &&
          user.role.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDepartment =
        filters.department === "all" || user.department === filters.department;

      const matchesDesignation =
        filters.designation === "all" ||
        user.designation === filters.designation;

      const matchesRole = filters.role === "all" || user.role === filters.role;

      return (
        matchesSearch && matchesDepartment && matchesDesignation && matchesRole
      );
    });
    setFilteredUsers(filtered);
  }, [searchTerm, filters, users]);

  useEffect(() => {
    // Initialize role updates when selected users change
    const updates = selectedUsers.map((userId) => ({
      userId,
      role: users.find((user) => user.id === userId)?.role || "Employee",
    }));
    setRoleUpdates(updates);
  }, [selectedUsers, users]);

  const fetchUsers = async () => {
    try {
      const response = await getManagementUsers();
      setUsers(response.users);
      setFilteredUsers(response.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users",
      });
    }
  };

  const fetchOKRs = async () => {
    try {
      const okrs = await getOKRs();
    } catch (error) {
      console.error("Error fetching OKRs:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch OKRs",
      });
    }
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setSelectedRole(user.role);
    setIsEditDialogOpen(true);
  };

  const handleUpdateRole = async () => {
    try {
      await updateUserRole(userToEdit!.id, selectedRole);
      const updatedUsers = users.map((user) =>
        user.id === userToEdit!.id ? { ...user, role: selectedRole } : user
      );
      setUsers(updatedUsers);
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user role",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      const updatedUsers = users.filter((user) => user.id !== userId);
      setUsers(updatedUsers);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      await fetchOKRs(); // Refetch OKRs after deletion
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user",
      });
    }
  };

  const handleBulkUpdateRoles = async () => {
    try {
      await bulkUpdateUserRoles(roleUpdates);
      const updatedUsers = users.map((user) => {
        const update = roleUpdates.find((u) => u.userId === user.id);
        return update ? { ...user, role: update.role } : user;
      });
      setUsers(updatedUsers);
      setSelectedUsers([]);
      toast({
        title: "Success",
        description: "User roles updated successfully",
      });
      setIsBulkEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating user roles:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user roles",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteUsers(selectedUsers);
      const updatedUsers = users.filter(
        (user) => !selectedUsers.includes(user.id)
      );
      setUsers(updatedUsers);
      setSelectedUsers([]);
      toast({
        title: "Success",
        description: "Users deleted successfully",
      });
      await fetchOKRs(); // Refetch OKRs after bulk deletion
      setIsBulkDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete users",
      });
    }
  };

  const handleSelectUser = (userId: string) => {
    if (userId === loggedInUser?.id) return; // Do not toggle selection for the logged-in user
    console.log(`Toggling selection for user ID: ${userId}`);
    setSelectedUsers((prev) => {
      const newSelection = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];
      console.log(`New selected users: ${newSelection}`);
      return newSelection;
    });
  };

  const handleSelectAllUsers = () => {
    const selectableUsers = filteredUsers.filter(
      (user) => user.id !== loggedInUser?.id
    );
    if (selectedUsers.length === selectableUsers.length) {
      setSelectedUsers([]); // Deselect all if all are selected
    } else {
      setSelectedUsers(selectableUsers.map((user) => user.id)); // Select all except the logged-in user
    }
  };

  const handleUpdateIndividualRole = (userId: string, role: string) => {
    setRoleUpdates((prev) =>
      prev.map((update) =>
        update.userId === userId ? { ...update, role } : update
      )
    );
  };

  const resetFilters = async () => {
    setIsResetting(true);
    setTimeout(() => {
      setFilters({
        department: "all",
        designation: "all",
        role: "all",
      });
      setSearchTerm("");
      setIsResetting(false);
      setIsFilterOpen(false);
    }, 500);
  };

  const designations = [...new Set(users.map((user) => user.designation))];
  const roles = [...new Set(users.map((user) => user.role))];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-blue-100 text-blue-700";
      case "Manager":
        return "bg-green-100 text-green-700";
      case "Employee":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>
        <div className="flex gap-2">
          {selectedUsers.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsBulkEditDialogOpen(true)}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Selected ({selectedUsers.length})
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsBulkDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedUsers.length})
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, department, designation, or role"
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => {
              e.preventDefault(); // Prevent default action if inside a form
              setSearchTerm(e.target.value);
            }}
          />
        </div>
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {Object.values(filters).some((value) => value !== "all") && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-100 text-blue-700"
                >
                  {
                    Object.values(filters).filter((value) => value !== "all")
                      .length
                  }
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Users</SheetTitle>
              <SheetDescription>
                Filter users by department, designation, and role
              </SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    value={filters.department}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, department: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departmentsData.departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Select
                    value={filters.designation}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, designation: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select designation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Designations</SelectItem>
                      {designations.map((desig) => (
                        <SelectItem key={desig} value={desig}>
                          {desig}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={filters.role}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </ScrollArea>
            <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
              <Button
                onClick={resetFilters}
                className={`w-full bg-blue-500 text-white hover:bg-blue-600 ${
                  isResetting ? "animate-pulse" : ""
                }`}
                disabled={
                  isResetting ||
                  Object.values(filters).every((value) => value === "all")
                }
              >
                <div className="relative flex items-center justify-center gap-2">
                  <RotateCcw
                    className={`h-4 w-4 transition-transform duration-500 ${
                      isResetting ? "animate-spin" : ""
                    }`}
                  />
                  Reset Filters
                </div>
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users</CardTitle>
            {filteredUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <Label className="text-sm" htmlFor="select-all-checkbox">
                  Select All
                </Label>
                <Checkbox
                  checked={
                    selectedUsers.length ===
                      filteredUsers.filter(
                        (user) => user.id !== loggedInUser?.id
                      ).length && filteredUsers.length > 0
                  }
                  onCheckedChange={handleSelectAllUsers}
                  aria-label="Select all users"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleSelectUser(user.id)}
                      aria-label={`Select ${user.fullName}`}
                      disabled={user.id === loggedInUser?.id} // Disable checkbox for logged-in user
                    />
                    <div>
                      <h3 className="font-medium">{user.fullName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary">{user.department}</Badge>
                        <Badge variant="outline">{user.designation}</Badge>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditUser(user)}
                      className="hover:bg-blue-50 dark:hover:bg-blue-900"
                      disabled={user.id === loggedInUser?.id} // Disable edit button for logged-in user
                    >
                      <Edit2 className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteUser(user.id)}
                      className="hover:bg-red-50 dark:hover:bg-red-900"
                      disabled={user.id === loggedInUser?.id} // Disable delete button for logged-in user
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-lg font-medium text-muted-foreground">
                  No Users were found
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
            <DialogDescription>
              Change the role for {userToEdit?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isBulkEditDialogOpen}
        onOpenChange={setIsBulkEditDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update User Roles</DialogTitle>
            <DialogDescription>
              Set individual roles for selected users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {selectedUsers.map((userId) => {
                  const user = users.find((u) => u.id === userId);
                  const currentRole = roleUpdates.find(
                    (u) => u.userId === userId
                  )?.role;
                  return (
                    <div
                      key={userId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{user?.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                      <Select
                        value={currentRole}
                        onValueChange={(value) =>
                          handleUpdateIndividualRole(userId, value)
                        }
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Employee">Employee</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBulkEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkUpdateRoles}>Update Roles</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedUsers.length} selected
              users. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete Users
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
