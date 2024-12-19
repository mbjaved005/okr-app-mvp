import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Search, RotateCcw, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { CreateOKRDialog } from "@/components/CreateOKRDialog";
import { EditOKRDialog } from "@/components/EditOKRDialog";
import { getOKRs, deleteOKR } from "@/api/okr";
import { getUsers } from "@/api/users";
import { format } from "date-fns";
import { getQuarter } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/useToast";
import departments from "@/data/departments.json";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Not Started":
      return "bg-red-500";
    case "In Progress":
      return "bg-blue-500";
    case "Completed":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};

const getUserInitials = (fullName: string) => {
  return fullName
    .split(" ")
    .map((name) => {
      const match = name.match(/^[A-Za-z]|\d+/g);
      return match ? match.join("") : "";
    })
    .join("");
};

const getQuarterLabels = (startDate: Date, endDate: Date) => {
  const quarters = [];
  let current = new Date(startDate);
  while (current <= endDate) {
    const quarter = getQuarter(current);
    if (!quarters.includes(quarter)) {
      quarters.push(quarter);
    }
    current.setMonth(current.getMonth() + 3);
  }
  return quarters;
};

const getStatusFromProgress = (progress: number) => {
  if (progress === 0) {
    return "Not Started";
  } else if (progress > 0 && progress < 100) {
    return "In Progress";
  } else if (progress === 100) {
    return "Completed";
  }
  return "Unknown";
};

export function OKRs() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOKR, setSelectedOKR] = useState(null);
  const [okrs, setOkrs] = useState<
    {
      id: string;
      title: string;
      description: string;
      department: string;
      category: string;
      createdBy: string;
      owners: string[];
      startDate: string;
      endDate: string;
      progress: number;
    }[]
  >([]);
  const [users, setUsers] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [filter, setFilter] = useState({
    department: "all",
    category: "all",
    search: "",
    createdBy: "all",
    owners: "all",
    startDate: "",
    endDate: "",
    quarter: "all",
    status: "all",
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [okrToDelete, setOkrToDelete] = useState(null);
  const { toast } = useToast();

  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
  const loggedInUserId = loggedInUser.id; // Assuming user ID is stored as 'id'

  useEffect(() => {
    const fetchOKRs = async () => {
      try {
        const response = await getOKRs();
        setOkrs(response.okrs);
      } catch (error) {
        console.error("Error fetching OKRs:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch OKRs",
        });
      }
    };
    fetchOKRs();
  }, [toast]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getUsers();
        setUsers(response.users);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch users",
        });
      }
    };
    fetchUsers();
  }, [toast]);

  const handleEditClick = (okr) => {
    setSelectedOKR(okr);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (okr) => {
    setOkrToDelete(okr);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteOKR(okrToDelete._id);
      const updatedOkrs = okrs.filter((okr) => okr._id !== okrToDelete._id);
      setOkrs(updatedOkrs);
      toast({
        title: "Success",
        description: "OKR deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete OKR",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setOkrToDelete(null);
    }
  };

  const handleOKRUpdated = async () => {
    try {
      const response = await getOKRs();
      setOkrs(response.okrs);
    } catch (error) {
      console.error("Error updating OKRs:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update OKRs",
      });
    }
  };

  const getOwnerInitials = (ownerId: string) => {
    const user = users.find((user) => user.id === ownerId);
    return user ? getUserInitials(user.name) : null;
  };

  const getOwnerName = (ownerId: string) => {
    const user = users.find((user) => user.id === ownerId);
    return user ? user.name : null;
  };

  const getUserInitialsById = (userId: string) => {
    const user = users.find((user) => user.id === userId);
    return user ? getUserInitials(user.name) : null;
  };

  const filteredOKRs = okrs.filter((okr) => {
    const matchesDepartment =
      filter.department === "all" || okr.department === filter.department;
    const matchesCategory =
      filter.category === "all" || okr.category === filter.category;
    const matchesSearch =
      !filter.search ||
      okr.title.toLowerCase().includes(filter.search.toLowerCase());
    const matchesCreatedBy =
      filter.createdBy === "all" || okr.createdBy === filter.createdBy;
    const matchesOwners =
      filter.owners === "all" ||
      okr.owners.some((owner) => owner === filter.owners);
    const matchesStatus =
      filter.status === "all" ||
      getStatusFromProgress(okr.progress) === filter.status;

    const okrQuarter = getQuarter(new Date(okr.startDate));
    const matchesQuarter =
      filter.quarter === "all" || okrQuarter === filter.quarter;

    const okrStartDate = new Date(okr.startDate);
    const okrEndDate = new Date(okr.endDate);
    const filterStartDate = filter.startDate
      ? new Date(filter.startDate)
      : null;
    const filterEndDate = filter.endDate ? new Date(filter.endDate) : null;

    const matchesDateRange =
      (!filterStartDate || okrStartDate >= filterStartDate) &&
      (!filterEndDate || okrEndDate <= filterEndDate);

    return (
      matchesDepartment &&
      matchesCategory &&
      matchesSearch &&
      matchesCreatedBy &&
      matchesOwners &&
      matchesStatus &&
      matchesQuarter &&
      matchesDateRange
    );
  });

  const resetFilters = async () => {
    setIsResetting(true);
    setTimeout(() => {
      setFilter({
        department: "all",
        category: "all",
        search: "",
        createdBy: "all",
        owners: "all",
        startDate: "",
        endDate: "",
        quarter: "all",
        status: "all",
      });
      setIsResetting(false);
      setIsFilterOpen(false);
    }, 500);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filter).filter(
      (value) => value !== "all" && value !== "" && value !== null
    ).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">OKRs</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create OKR
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search OKRs..."
            className="pl-8 w-full"
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          />
        </div>
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {getActiveFiltersCount() > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-100 text-blue-700"
                >
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-[440px]">
            <SheetHeader className="space-y-2.5">
              <SheetTitle>Filter OKRs</SheetTitle>
              <SheetDescription>
                Refine your OKR list using the filters below
              </SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Department</Label>
                  <Select
                    value={filter.department}
                    onValueChange={(value) =>
                      setFilter({ ...filter, department: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.departments.map((department) => (
                        <SelectItem key={department} value={department}>
                          {department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category</Label>
                  <Select
                    value={filter.category}
                    onValueChange={(value) =>
                      setFilter({ ...filter, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Team">Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Created By</Label>
                  <Select
                    value={filter.createdBy}
                    onValueChange={(value) =>
                      setFilter({ ...filter, createdBy: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select creator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Creators</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.name}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Owners</Label>
                  <Select
                    value={filter.owners}
                    onValueChange={(value) =>
                      setFilter({ ...filter, owners: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Owners</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quarter</Label>
                  <Select
                    value={filter.quarter}
                    onValueChange={(value) =>
                      setFilter({ ...filter, quarter: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select quarter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Quarters</SelectItem>
                      <SelectItem value="Q1">Q1</SelectItem>
                      <SelectItem value="Q2">Q2</SelectItem>
                      <SelectItem value="Q3">Q3</SelectItem>
                      <SelectItem value="Q4">Q4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Select
                    value={filter.status}
                    onValueChange={(value) =>
                      setFilter({ ...filter, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date Range</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Start Date
                      </Label>
                      <Input
                        type="date"
                        value={filter.startDate}
                        onChange={(e) =>
                          setFilter({ ...filter, startDate: e.target.value })
                        }
                        className="h-11 w-50 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        End Date
                      </Label>
                      <Input
                        type="date"
                        value={filter.endDate}
                        onChange={(e) =>
                          setFilter({ ...filter, endDate: e.target.value })
                        }
                        className="h-11 w-50 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
              <Button
                onClick={resetFilters}
                className={`w-full bg-blue-500 text-white hover:bg-blue-600 ${
                  isResetting ? "animate-pulse" : ""
                }`}
                disabled={isResetting || getActiveFiltersCount() === 0}
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

      <div className="space-y-4">
        {filteredOKRs.length > 0 ? (
          filteredOKRs.map((okr) => (
            <Card key={okr.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{okr.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    {(okr.owners.includes(loggedInUserId) ||
                      okr.createdBy === loggedInUserId) && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(okr)}
                          className="hover:bg-blue-50 dark:hover:bg-blue-900"
                        >
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(okr)}
                          className="hover:bg-red-50 dark:hover:bg-red-900"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                    {getQuarterLabels(
                      new Date(okr.startDate),
                      new Date(okr.endDate)
                    ).map((quarter) => (
                      <Badge key={quarter} variant="secondary">
                        {quarter}
                      </Badge>
                    ))}
                    <Badge
                      className={`${getStatusColor(
                        getStatusFromProgress(okr.progress)
                      )} text-white`}
                    >
                      {getStatusFromProgress(okr.progress)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {okr.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Overall Progress</span>
                      <span className="font-medium">{okr.progress}%</span>
                    </div>
                    <Progress value={okr.progress} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Department</p>
                      <p className="font-medium">{okr.department}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p className="font-medium">{okr.category}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Start Date</p>
                      <p className="font-medium">
                        {format(new Date(okr.startDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">End Date</p>
                      <p className="font-medium">
                        {format(new Date(okr.endDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created By</p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                              {getUserInitialsById(okr.createdBy)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{getOwnerName(okr.createdBy)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Owners</p>
                      <div className="flex -space-x-2">
                        {okr.owners.map((owner, index) => {
                          const ownerInitials = getOwnerInitials(owner);
                          const ownerName = getOwnerName(owner);
                          return ownerInitials && ownerName ? (
                            <TooltipProvider key={index}>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600 ring-2 ring-white">
                                    {ownerInitials}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{ownerName}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center text-muted-foreground mt-10">
            <h2 className="text-2xl font-semibold">No OKRs at the moment</h2>
            <p className="mt-2 text-sm">
              It looks like there are no OKRs to display. Create a new OKR to
              get started!
            </p>
          </div>
        )}
      </div>

      <CreateOKRDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onOKRUpdated={handleOKRUpdated} // Pass the function to refresh OKRs
      />

      {selectedOKR && (
        <EditOKRDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          okrId={selectedOKR._id}
          onOKRUpdated={handleOKRUpdated}
        />
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this OKR?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the OKR
              and all of its associated key results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
