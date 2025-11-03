import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileCheck, UserCheck, Clock, Building2, Shield, User } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { ProfileSection } from "@/components/ProfileSection";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchStats();
    fetchAllRequests();
    fetchAllUsers();
  }, []);

  useEffect(() => {
    let filtered = requests;
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter((r) =>
        r.students?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reason?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredRequests(filtered);
  }, [statusFilter, searchQuery, requests]);

  useEffect(() => {
    let filtered = allUsers;
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }
    setFilteredUsers(filtered);
  }, [roleFilter, allUsers]);

  const fetchStats = async () => {
    const { count: studentsCount } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true });
    
    const { count: hallAdminsCount } = await supabase
      .from("hall_admins")
      .select("*", { count: "exact", head: true });
    
    const { count: securityCount } = await supabase
      .from("security_personnel")
      .select("*", { count: "exact", head: true });
    
    const { count: superAdminsCount } = await supabase
      .from("super_admins")
      .select("*", { count: "exact", head: true });

    const totalUsers = (studentsCount || 0) + (hallAdminsCount || 0) + 
                       (securityCount || 0) + (superAdminsCount || 0);

    const { count: requestsCount } = await supabase
      .from("exit_requests")
      .select("*", { count: "exact", head: true });

    const { count: pendingCount } = await supabase
      .from("exit_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: approvedCount } = await supabase
      .from("exit_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved");

    setStats({
      totalUsers,
      totalRequests: requestsCount || 0,
      pendingRequests: pendingCount || 0,
      approvedRequests: approvedCount || 0,
    });
    setLoading(false);
  };

  const fetchAllRequests = async () => {
    const { data, error } = await supabase
      .from("exit_requests")
      .select(`
        *,
        students:student_id (full_name, student_id, hall_id, halls:hall_id (name))
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRequests(data);
      setFilteredRequests(data);
    }
  };

  const fetchAllUsers = async () => {
    const users = [];
    
    const { data: students } = await supabase
      .from("students")
      .select("*, halls:hall_id (name)");
    if (students) {
      users.push(...students.map((s) => ({ ...s, role: "student" })));
    }

    const { data: hallAdmins } = await supabase
      .from("hall_admins")
      .select("*, halls:hall_id (name)");
    if (hallAdmins) {
      users.push(...hallAdmins.map((h) => ({ ...h, role: "hall_admin" })));
    }

    const { data: security } = await supabase
      .from("security_personnel")
      .select("*");
    if (security) {
      users.push(...security.map((s) => ({ ...s, role: "security" })));
    }

    const { data: superAdmins } = await supabase
      .from("super_admins")
      .select("*");
    if (superAdmins) {
      users.push(...superAdmins.map((s) => ({ ...s, role: "super_admin" })));
    }

    setAllUsers(users);
    setFilteredUsers(users);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "student": return "Student";
      case "hall_admin": return "Hall Admin";
      case "security": return "Security";
      case "super_admin": return "Super Admin";
      default: return role;
    }
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
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">All Requests</TabsTrigger>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="exited">Exited</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <p className="text-muted-foreground">No requests found.</p>
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {request.students?.full_name || "Unknown Student"}
                          </span>
                          {request.students?.student_id && (
                            <span className="text-sm text-muted-foreground">
                              ({request.students.student_id})
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-lg">{request.reason}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          Submitted {format(new Date(request.created_at), "PPp")}
                        </CardDescription>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">Hall:</span>
                      <span className="ml-2">
                        {request.students?.halls?.name || "Not assigned"}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Destination:</span>
                      <span className="ml-2">{request.destination}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Expected Return:</span>
                      <span className="ml-2">
                        {format(new Date(request.expected_return_date), "PPp")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex gap-4 items-center">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="hall_admin">Hall Admins</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="super_admin">Super Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredUsers.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <p className="text-muted-foreground">No users found.</p>
                </CardContent>
              </Card>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {user.role === "student" && <User className="h-4 w-4" />}
                          {user.role === "hall_admin" && <Building2 className="h-4 w-4" />}
                          {user.role === "security" && <Shield className="h-4 w-4" />}
                          {user.role === "super_admin" && <Users className="h-4 w-4" />}
                          <CardTitle className="text-lg">{user.full_name}</CardTitle>
                        </div>
                        <CardDescription className="mt-1">
                          {getRoleLabel(user.role)}
                          {user.student_id && ` • ${user.student_id}`}
                          {user.hall_admin_id && ` • ${user.hall_admin_id}`}
                          {user.security_id && ` • ${user.security_id}`}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {user.halls?.name && (
                      <div className="flex items-center text-sm">
                        <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-medium">Hall:</span>
                        <span className="ml-2">{user.halls.name}</span>
                      </div>
                    )}
                    {user.phone_number && (
                      <div className="text-sm">
                        <span className="font-medium">Phone:</span>
                        <span className="ml-2">{user.phone_number}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="profile">
          {user && <ProfileSection user={user} />}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;