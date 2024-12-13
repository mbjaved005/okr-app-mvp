import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuthStatus } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const check = async () => {
      await checkAuthStatus();
      console.log("ProtectedRoute: isAuthenticated after check:", isAuthenticated);
      setIsChecking(false);
    };
    check();
  }, [checkAuthStatus, isAuthenticated]);

  if (isChecking) {
    console.log("ProtectedRoute: Checking authentication status");
    return null; // or a loading spinner
  }

  if (!isAuthenticated) {
    console.log("ProtectedRoute: Redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log("ProtectedRoute: Rendering protected content");
  return <>{children}</>;
}