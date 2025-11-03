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
import { Plus, Calendar, MapPin, MessageSquare, Edit, Trash2, Building2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [formData, setFormData] = useState({
    reason: "",
    destination: "",
    expectedReturnDate: "",
    additionalComments: "",
  });
  const [hallId, setHallId] = useState<string | null>(null);
  const [hallName, setHallName] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
    fetchStudentHall();
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

  const fetchStudentHall = async () => {
    if (!user) return;
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("hall_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!studentError && student) {
      setHallId(student.hall_id || null);
      if (student.hall_id) {
        const { data: hall, error: hallError } = await supabase
          .from("halls")
          .select("name")
          .eq("id", student.hall_id)
          .maybeSingle();
        if (!hallError && hall) {
          setHallName(hall.name);
        } else {
          setHallName(null);
        }
      } else {
        setHallName(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      requestSchema.parse(formData);

      // Check for active request only when creating new request
      if (!editingRequest) {
        const hasActive = requests.some(
          (r) => r.status === "pending" || r.status === "approved" || r.status === "exited"
        );
        if (hasActive) {
          toast({
            title: "Active request exists",
            description: "You must complete your current request before creating a new one.",
            variant: "destructive",
          });
          return;
        }
        if (!hallId) {
          toast({
            title: "Set your hall",
            description: "Please set your hall in Profile before creating a request.",
            variant: "destructive",
          });
          return;
        }
      }

      if (editingRequest) {
        // Update existing request
        const { error } = await supabase
          .from("exit_requests")
          .update({
            reason: formData.reason,
            destination: formData.destination,
            expected_return_date: new Date(formData.expectedReturnDate).toISOString(),
            additional_comments: formData.additionalComments || null,
          })
          .eq("id", editingRequest.id);

        if (error) throw error;

        toast({
          title: "Request updated!",
          description: "Your exit request has been updated.",
        });
      } else {
        // Create new request
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
      }

      setIsDialogOpen(false);
      setEditingRequest(null);
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

  const handleEdit = (request: any) => {
    setEditingRequest(request);
    setFormData({
      reason: request.reason,
      destination: request.destination,
      expectedReturnDate: format(new Date(request.expected_return_date), "yyyy-MM-dd'T'HH:mm"),
      additionalComments: request.additional_comments || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (requestId: string) => {
    const { error } = await supabase
      .from("exit_requests")
      .delete()
      .eq("id", requestId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete request",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Request deleted",
        description: "Your exit request has been deleted.",
      });
      fetchRequests();
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingRequest(null);
      setFormData({
        reason: "",
        destination: "",
        expectedReturnDate: "",
        additionalComments: "",
      });
    }
  };

  const hasActive = requests.some(
    (r) => r.status === "pending" || r.status === "approved" || r.status === "exited"
  );

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
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button disabled={hasActive || !hallId}>
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingRequest ? "Edit Exit Request" : "Create Exit Request"}</DialogTitle>
                <DialogDescription>
                  {editingRequest ? "Update the details of your exit request." : "Fill in the details for your campus exit request."}
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
                  {editingRequest ? "Update Request" : "Submit Request"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
          {(hasActive || !hallId) && (
            <p className="text-xs text-muted-foreground">
              {hasActive
                ? "You already have an active request. Complete it before creating a new one."
                : "Set your hall in Profile before creating a request."}
            </p>
          )}

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
                    <div className="flex-1">
                      <CardTitle className="text-lg">{request.reason}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(request.created_at), "PPp")}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={request.status} />
                      {request.status === "pending" && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(request)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Request</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this exit request? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(request.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
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
                  <div className="flex items-center text-sm">
                    <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">Hall:</span>
                    <span className="ml-2">{hallName || "Not set"}</span>
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
          {user && <ProfileSection user={user} />}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default StudentDashboard;