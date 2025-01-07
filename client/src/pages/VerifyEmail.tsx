import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
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
          <CardContent>
            {loading ? (
              <div className="space-y-4 text-center">
                <h2 className="verifying font-semibold">
                  Verifying. Please wait a moment...
                </h2>
                <div className="flex justify-center items-center h-16">
                  <Spinner className="h-8 w-8" />
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <h2 className="text-xl font-semibold">{message}</h2>
                <Button onClick={handleRedirect}>Go to Login</Button>
              </div>
            )}
          </CardContent>
        </CardHeader>
      </Card>
    </div>
  );
}

export default VerifyEmail;
