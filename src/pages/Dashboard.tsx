import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import StudentDashboard from "./StudentDashboard";
import HallAdminDashboard from "./HallAdminDashboard";
import SecurityDashboard from "./SecurityDashboard";
import SuperAdminDashboard from "./SuperAdminDashboard";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user?.id);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No role assigned. Please contact administrator.</p>
        </div>
      </div>
    );
  }

  switch (role) {
    case "student":
      return <StudentDashboard />;
    case "hall_admin":
      return <HallAdminDashboard />;
    case "security":
      return <SecurityDashboard />;
    case "super_admin":
      return <SuperAdminDashboard />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Unknown role. Please contact administrator.</p>
          </div>
        </div>
      );
  }
};

export default Dashboard;
