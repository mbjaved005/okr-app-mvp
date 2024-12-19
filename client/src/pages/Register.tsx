import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { UserPlus, X } from "lucide-react";
import { register as registerUser } from "@/api/auth";
import departments from "@/data/departments.json";

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  role: string;
  designation: string;
  department: string;
  profilePicture?: FileList;
};

export function Register() {
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();
  const profilePicture = watch("profilePicture");

  const onSubmit = async (data: RegisterForm) => {
    try {
      setLoading(true);
      setEmailError("");
      const formData = {
        ...data,
        profilePicture: data.profilePicture?.[0],
      };
      const response = await registerUser(formData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Account created successfully",
        });
        navigate("/login");
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (error) {
      if (error.response && error.response.status === 405) {
        setEmailError("Email is already registered");
        error.message = "Email is already registered";
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Registration failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearProfilePicture = () => {
    setValue("profilePicture", undefined);
    const fileInput = document.getElementById(
      "profilePicture"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Enter your details to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter your name"
                className="w-full"
                {...register("name", { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="w-full"
                {...register("email", { required: true })}
              />
              {emailError && <p className="text-destructive">{emailError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Choose a password"
                className="w-full"
                autoComplete="new-password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                aria-invalid={errors.password ? "true" : "false"}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">
                Role <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) => setValue("role", value)}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Employee">Employee</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">
                Designation <span className="text-destructive">*</span>
              </Label>
              <Input
                id="designation"
                placeholder="Enter your designation"
                className="w-full"
                {...register("designation", { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">
                Department <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) => setValue("department", value)}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.departments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profilePicture">Profile Picture</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  className="w-full"
                  {...register("profilePicture")}
                />
                {profilePicture && profilePicture.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={clearProfilePicture}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                "Loading..."
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            className="text-sm text-blue-500"
            onClick={() => navigate("/login")}
          >
            Already have an account? Sign in
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
