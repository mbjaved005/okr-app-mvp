import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { ThemeProvider } from "./components/ui/theme-provider";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { OKRs } from "./pages/OKRs";
import { Reports } from "./pages/Reports";
import { Teams } from "./pages/Teams";
import { Settings } from "./pages/Settings";
import { UserManagement } from "./pages/UserManagement";
import { OKRDetail } from "./pages/OKRDetail";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useEffect } from "react";

function RouteLogger() {
  const location = useLocation();

  useEffect(() => {
    console.log("Route changed to:", location.pathname);
  }, [location]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="light" storageKey="ui-theme">
        <Router>
          <RouteLogger />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="okrs" element={<OKRs />} />
              <Route path="okrs/:id" element={<OKRDetail />} />
              <Route path="teams" element={<Teams />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="user-management" element={<UserManagement />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

function NotFound() {
  useEffect(() => {
    console.error("404 - Page not found");
  }, []);

  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
    </div>
  );
}

export default App;
