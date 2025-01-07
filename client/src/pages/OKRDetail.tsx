import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EditOKRDialog } from "@/components/EditOKRDialog";
import { getOKRById } from "@/api/okr";
import { getUsers } from "@/api/users";
import { format } from "date-fns";
import { Edit, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getQuarter } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import "react-circular-progressbar/dist/styles.css";

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

const getStatusFromProgress = (progress: number) => {
  if (progress === 0) return "Not Started";
  if (progress === 100) return "Completed";
  return "In Progress";
};

const getUserInitials = (fullName: string) => {
  return fullName
    .split(" ")
    .map((name) => name.charAt(0))
    .join("")
    .toUpperCase();
};

const getQuarterLabels = (startDate: Date, endDate: Date) => {
  const quarters: string[] = [];
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

export function OKRDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [okr, setOkr] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<
    { id: string; name: string; email: string; profilePicture?: string }[]
  >([]);

  const getUserProfilePicture = (userId: string) => {
    const user = users.find((user) => user.id === userId);
    if (!user) return null;
    return user.profilePicture ? user.profilePicture.replace(/\\/g, "/") : null;
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [okrResponse, usersResponse] = await Promise.all([
          getOKRById(id!),
          getUsers(),
        ]);
        setOkr(okrResponse.okr);
        setUsers(usersResponse.users);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch OKR details",
        });
        navigate("/okrs");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate, toast]);

  const handleOKRUpdated = async () => {
    try {
      const response = await getOKRById(id!);
      setOkr(response.okr);
      toast({
        title: "Success",
        description: "OKR updated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to refresh OKR details",
      });
    }
  };

  const getOwnerName = (ownerId: string) => {
    const user = users.find((user) => user.id === ownerId);
    return user ? user.name : "Unknown User";
  };

  const canEdit =
    okr &&
    (okr.createdBy === loggedInUser.id || okr.owners.includes(loggedInUser.id));

  if (!okr) return null;

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/okrs")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to OKRs
            </Button>
            {canEdit && (
              <Button
                onClick={() => setIsEditDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit OKR
              </Button>
            )}
          </div>

          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold">
                  {okr.title}
                </CardTitle>
                <Badge
                  className={`${getStatusColor(
                    getStatusFromProgress(okr.progress)
                  )} text-white`}
                >
                  {getStatusFromProgress(okr.progress)}
                </Badge>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                {okr.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-medium">{okr.progress}%</span>
                </div>
                <Progress value={okr.progress} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Department
                  </h3>
                  <p className="mt-1 text-base">{okr.department}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Category
                  </h3>
                  <p className="mt-1 text-base">{okr.category}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Start Date
                  </h3>
                  <p className="mt-1 text-base">
                    {format(new Date(okr.startDate), "MMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    End Date
                  </h3>
                  <p className="mt-1 text-base">
                    {format(new Date(okr.endDate), "MMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Quarter
                  </h3>
                  <div className="mt-1 flex gap-2">
                    {getQuarterLabels(
                      new Date(okr.startDate),
                      new Date(okr.endDate)
                    ).map((quarter) => (
                      <Badge key={quarter} variant="secondary">
                        {quarter}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Created By</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Avatar className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-background text-sm font-medium text-blue-600">
                          <AvatarImage
                            src={getUserProfilePicture(okr.createdBy)}
                            alt="Profile"
                          />
                          <AvatarFallback>
                            {getUserInitials(getOwnerName(okr.createdBy))}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getOwnerName(okr.createdBy)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  Owners
                </h3>
                <div className="flex -space-x-2">
                  {okr.owners.map((ownerId: string, index: number) => {
                    const ownerInitials = getUserInitials(
                      getOwnerName(ownerId)
                    );
                    const ownerName = getOwnerName(ownerId);
                    const ownerProfilePicture = getUserProfilePicture(ownerId);
                    return ownerInitials && ownerName ? (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger>
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={ownerProfilePicture}
                                alt={ownerName}
                              />
                              <AvatarFallback>{ownerInitials}</AvatarFallback>
                            </Avatar>
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
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                  Key Results
                </h3>
                <div className="space-y-4">
                  {okr.keyResults.map((kr: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12">
                            <CircularProgressbar
                              value={Math.round(
                                (kr.currentValue / kr.targetValue) * 100
                              )}
                              text={`${Math.round(
                                (kr.currentValue / kr.targetValue) * 100
                              )}%`}
                              styles={buildStyles({
                                textSize: "30px",
                              })}
                            />
                          </div>
                          <h4 className="font-medium">{kr.title}</h4>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {okr && (
            <EditOKRDialog
              open={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              okrId={okr._id}
              onOKRUpdated={handleOKRUpdated}
            />
          )}
        </>
      )}
    </div>
  );
}
