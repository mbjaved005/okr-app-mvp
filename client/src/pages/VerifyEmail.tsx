import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import api from "@/api/Api";

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      api
        .get(`/auth/verify-email?token=${token}`) // Call backend endpoint
        .then((response) => {
          setMessage(response.data.message);
          toast({
            title: "Success",
            description: response.data.message,
          });
        })
        .catch((error) => {
          setMessage(error.response?.data?.error || "Verification failed");
          toast({
            variant: "destructive",
            title: "Error",
            description: error.response?.data?.error || "Verification failed",
          });
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setMessage("Invalid verification link");
      setLoading(false);
    }
  }, [searchParams, toast]);

  const handleRedirect = () => {
    navigate("/"); // Redirect to the login page or any other page
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div>
              <p>{message}</p>
              <Button onClick={handleRedirect}>Go to Login</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default VerifyEmail;
