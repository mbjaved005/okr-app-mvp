import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, Search, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getUsers } from "@/api/users";
import { getOKRs } from "@/api/okr";
import { useAuth } from "@/contexts/AuthContext";
import departments from "@/data/departments.json";

type Employee = {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  role: string;
  profilePicture?: string;
  progress: number;
  okrsCount: number;
};

export function Teams() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    department: "all",
    designation: "all",
  });
  const { user } = useAuth();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await getUsers();
        const okrResponse = await getOKRs();
        console.log("OKRs fetched:", okrResponse.okrs);

        const employeesWithStats = response.users.map((user) => {
          const userOKRs = okrResponse.okrs.filter((okr) =>
            okr.owners.includes(user.id)
          );
          console.log(`User's OKRs for ${user.name}:`, userOKRs);

          const averageProgress =
            userOKRs.length > 0
              ? Math.round(
                  userOKRs.reduce((sum, okr) => sum + okr.progress, 0) /
                    userOKRs.length
                )
              : 0;

          return {
            ...user,
            progress: averageProgress, // Calculate average progress based on OKRs where the user is an owner
            okrsCount: userOKRs.length, // Count OKRs where the user is an owner
          };
        });
        setEmployees(employeesWithStats);
        setFilteredEmployees(employeesWithStats);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    fetchEmployees();
  }, [user]);

  useEffect(() => {
    const filtered = employees.filter((employee) => {
      const matchesSearch =
        searchTerm === "" ||
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.role.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment =
        filters.department === "all" ||
        employee.department === filters.department;

      const matchesDesignation =
        filters.designation === "all" ||
        employee.designation === filters.designation;

      return matchesSearch && matchesDepartment && matchesDesignation;
    });
    console.log(`Employees -->${JSON.stringify(filtered)}`);
    setFilteredEmployees(filtered);
  }, [searchTerm, filters, employees]);

  const designations = [...new Set(employees.map((emp) => emp.designation))];

  const resetFilters = () => {
    setFilters({
      department: "all",
      designation: "all",
    });
    setIsFilterOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Employee Directory</h1>
        <p className="text-sm text-muted-foreground">
          Showing {filteredEmployees.length} of {employees.length} employees
        </p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, department, designation, or role..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Employees</SheetTitle>
              <SheetDescription>
                Filter employees by department and designation
              </SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
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
                    {departments.departments.map((dept) => (
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
            </div>
            <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
              <Button onClick={resetFilters} className="w-full">
                Reset Filters
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-12 w-12">
                {employee.profilePicture ? (
                  <AvatarImage
                    src={`${
                      process.env.API_URL
                    }/${employee.profilePicture.replace(/\\/g, "/")}`}
                    alt={employee.name}
                  />
                ) : (
                  <AvatarFallback>
                    {employee.name
                      ? employee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : "N/A"}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <CardTitle className="text-lg">{employee.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {employee.designation}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{employee.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{employee.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium">{employee.role}</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Average OKR Progress
                    </span>
                    <span className="font-medium">{employee.progress}%</span>
                  </div>
                  <Progress value={employee.progress} className="mt-2" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total OKRs</p>
                  <p className="font-medium">{employee.okrsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
