import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/StatusBadge";
import { ProfileSection } from "@/components/ProfileSection";
import { Plus, Calendar, MapPin, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

const requestSchema = z.object({
  reason: z.string().min(5, "Reason must be at least 5 characters").max(200),
  destination: z.string().min(3, "Destination must be at least 3 characters").max(100),
  expectedReturnDate: z.string().min(1, "Return date is required"),
  additionalComments: z.string().max(500).optional(),
});

const StudentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    reason: "",
    destination: "",
    expectedReturnDate: "",
    additionalComments: "",
  });

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("exit_requests")
      .select("*")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      requestSchema.parse(formData);

      const { error } = await supabase.from("exit_requests").insert({
        student_id: user?.id,
        reason: formData.reason,
        destination: formData.destination,
        expected_return_date: new Date(formData.expectedReturnDate).toISOString(),
        additional_comments: formData.additionalComments || null,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Request submitted!",
        description: "Your exit request has been submitted for approval.",
      });

      setIsDialogOpen(false);
      setFormData({
        reason: "",
        destination: "",
        expectedReturnDate: "",
        additionalComments: "",
      });
      fetchRequests();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to submit request",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Student Dashboard">
        <div className="text-center py-12">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Dashboard">
      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="requests">Exit Requests</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-muted-foreground">Manage your campus exit requests</p>
            </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Exit Request</DialogTitle>
                <DialogDescription>
                  Fill in the details for your campus exit request.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Exit</Label>
                  <Input
                    id="reason"
                    placeholder="E.g., Medical appointment"
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    placeholder="E.g., City Hospital"
                    value={formData.destination}
                    onChange={(e) =>
                      setFormData({ ...formData, destination: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="returnDate">Expected Return Date</Label>
                  <Input
                    id="returnDate"
                    type="datetime-local"
                    value={formData.expectedReturnDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expectedReturnDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comments">Additional Comments (Optional)</Label>
                  <Textarea
                    id="comments"
                    placeholder="Any additional information..."
                    value={formData.additionalComments}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        additionalComments: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Submit Request
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <p className="text-muted-foreground">
                  No exit requests yet. Create your first request to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{request.reason}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(request.created_at), "PPp")}
                      </CardDescription>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Destination:</span>
                    <span className="ml-2">{request.destination}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Expected Return:</span>
                    <span className="ml-2">
                      {format(new Date(request.expected_return_date), "PPp")}
                    </span>
                  </div>
                  {request.additional_comments && (
                    <div className="flex items-start text-sm">
                      <MessageSquare className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {request.additional_comments}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
        </TabsContent>

        <TabsContent value="profile">
          {user && <ProfileSection user={user} showHallSelection={true} />}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default StudentDashboard;
