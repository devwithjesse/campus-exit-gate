import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/StatusBadge";
import { ProfileSection } from "@/components/ProfileSection";
import { Search, CheckCircle, User, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

const SecurityDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [passId, setPassId] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [recentExits, setRecentExits] = useState<any[]>([]);

  useEffect(() => {
    fetchRecentExits();
  }, []);

  const fetchRecentExits = async () => {
    const { data, error } = await supabase
      .from("exit_requests")
      .select(`
        *,
        profiles:student_id (full_name, student_id)
      `)
      .in("status", ["exited", "returned"])
      .order("updated_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setRecentExits(data);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passId.trim()) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("exit_requests")
      .select(`
        *,
        profiles:student_id (full_name, student_id, phone_number)
      `)
      .eq("qr_code", passId.trim())
      .single();

    if (!error && data) {
      setSearchResult(data);
      if (data.status !== "approved" && data.status !== "exited") {
        toast({
          title: "Invalid Pass",
          description: `This pass is ${data.status}. Cannot be used for exit.`,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Pass Not Found",
        description: "No exit pass found with this ID.",
        variant: "destructive",
      });
      setSearchResult(null);
    }
    setLoading(false);
  };

  const handleMarkExited = async () => {
    if (!searchResult) return;

    const { error } = await supabase
      .from("exit_requests")
      .update({
        status: "exited",
        updated_at: new Date().toISOString(),
      })
      .eq("id", searchResult.id);

    if (!error) {
      toast({
        title: "Student Exited",
        description: "Exit has been recorded successfully.",
      });
      setSearchResult({ ...searchResult, status: "exited" });
      setPassId("");
      fetchRecentExits();
    } else {
      toast({
        title: "Error",
        description: "Failed to record exit",
        variant: "destructive",
      });
    }
  };

  const handleMarkReturned = async () => {
    if (!searchResult) return;

    const { error } = await supabase
      .from("exit_requests")
      .update({
        status: "returned",
        actual_return_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", searchResult.id);

    if (!error) {
      toast({
        title: "Return Recorded",
        description: "Student return has been recorded successfully.",
      });
      setSearchResult({ ...searchResult, status: "returned" });
      setPassId("");
      fetchRecentExits();
    } else {
      toast({
        title: "Error",
        description: "Failed to record return",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout title="Security Officer">
      <Tabs defaultValue="verify" className="space-y-6">
        <TabsList>
          <TabsTrigger value="verify">Verify Passes</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="verify" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Verify Exit Pass</CardTitle>
            <CardDescription>
              Scan QR code or enter Pass ID to verify student exit pass
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passId">Pass ID</Label>
                <div className="flex space-x-2">
                  <Input
                    id="passId"
                    placeholder="Enter or scan QR code"
                    value={passId}
                    onChange={(e) => setPassId(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={loading}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </form>

            {searchResult && (
              <div className="mt-6 p-4 border rounded-lg space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {searchResult.profiles?.full_name || "Unknown Student"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {searchResult.profiles?.student_id && `ID: ${searchResult.profiles.student_id}`}
                    </p>
                  </div>
                  <StatusBadge status={searchResult.status} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Destination:</span>
                    <span className="ml-2">{searchResult.destination}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Expected Return:</span>
                    <span className="ml-2">
                      {format(new Date(searchResult.expected_return_date), "PPp")}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Reason:</span>
                    <span className="ml-2">{searchResult.reason}</span>
                  </div>
                </div>

                {searchResult.status === "approved" && (
                  <Button onClick={handleMarkExited} className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Exited
                  </Button>
                )}

                {searchResult.status === "exited" && (
                  <Button onClick={handleMarkReturned} className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Returned
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest exits and returns</CardDescription>
          </CardHeader>
          <CardContent>
            {recentExits.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentExits.map((exit) => (
                  <div
                    key={exit.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">
                          {exit.profiles?.full_name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {exit.destination}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={exit.status} />
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(exit.updated_at), "p")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="profile">
          {user && <ProfileSection user={user} showHallSelection={false} />}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default SecurityDashboard;
