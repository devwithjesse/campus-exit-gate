import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileCheck, UserCheck, Clock } from "lucide-react";

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // Fetch total users
    const { count: usersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Fetch total requests
    const { count: requestsCount } = await supabase
      .from("exit_requests")
      .select("*", { count: "exact", head: true });

    // Fetch pending requests
    const { count: pendingCount } = await supabase
      .from("exit_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Fetch approved requests
    const { count: approvedCount } = await supabase
      .from("exit_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved");

    setStats({
      totalUsers: usersCount || 0,
      totalRequests: requestsCount || 0,
      pendingRequests: pendingCount || 0,
      approvedRequests: approvedCount || 0,
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <DashboardLayout title="Super Administrator">
        <div className="text-center py-12">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Super Administrator">
      <div className="space-y-6">
        <div>
          <p className="text-muted-foreground">System overview and statistics</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered in system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRequests}</div>
              <p className="text-xs text-muted-foreground">All time requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Requests</CardTitle>
              <UserCheck className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedRequests}</div>
              <p className="text-xs text-muted-foreground">Active exit passes</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Campus Exit Management System</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Features</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Multi-role user management (Student, Hall Admin, Security, Super Admin)</li>
                <li>Exit request workflow with approval system</li>
                <li>QR code generation for approved passes</li>
                <li>Real-time status tracking</li>
                <li>Security verification dashboard</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Roles Overview</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Student:</strong> Create and track exit requests</p>
                <p><strong>Hall Administrator:</strong> Review and approve/decline requests</p>
                <p><strong>Security:</strong> Verify passes and record exits/returns</p>
                <p><strong>Super Admin:</strong> System oversight and user management</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;
