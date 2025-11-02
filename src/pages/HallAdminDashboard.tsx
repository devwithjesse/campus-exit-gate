import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/StatusBadge";
import { ProfileSection } from "@/components/ProfileSection";
import { useAuth } from "@/hooks/useAuth";
import { Check, X, Calendar, MapPin, User } from "lucide-react";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const HallAdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("exit_requests")
      .select(`
        *,
        profiles:student_id (full_name, student_id)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  };

  const handleApprove = async (requestId: string) => {
    const qrCode = `CEMS-${requestId}-${Date.now()}`;

    const { error } = await supabase
      .from("exit_requests")
      .update({
        status: "approved",
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        qr_code: qrCode,
      })
      .eq("id", requestId);

    if (!error) {
      toast({
        title: "Request approved",
        description: "Exit pass has been generated with QR code.",
      });
      fetchRequests();
    } else {
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (requestId: string) => {
    const { error } = await supabase
      .from("exit_requests")
      .update({
        status: "declined",
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (!error) {
      toast({
        title: "Request declined",
        description: "The exit request has been declined.",
      });
      fetchRequests();
    } else {
      toast({
        title: "Error",
        description: "Failed to decline request",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Hall Administrator">
        <div className="text-center py-12">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Hall Administrator">
      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="requests">Exit Requests</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          <div>
            <p className="text-muted-foreground">Review and approve exit requests from students in your hall</p>
          </div>

        <div className="grid gap-4">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <p className="text-muted-foreground">No exit requests to review.</p>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {request.profiles?.full_name || "Unknown Student"}
                        </span>
                        {request.profiles?.student_id && (
                          <span className="text-sm text-muted-foreground">
                            ({request.profiles.student_id})
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-lg">{request.reason}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        Submitted {format(new Date(request.created_at), "PPp")}
                      </CardDescription>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
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
                      <div className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-md">
                        {request.additional_comments}
                      </div>
                    )}
                  </div>

                  {request.status === "pending" && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDecline(request.id)}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}

                  {request.status === "approved" && request.qr_code && (
                    <div className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        View QR Code
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog
          open={!!selectedRequest}
          onOpenChange={() => setSelectedRequest(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exit Pass QR Code</DialogTitle>
              <DialogDescription>
                {selectedRequest?.profiles?.full_name || "Student"} - {selectedRequest?.reason}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4 py-4">
              {selectedRequest?.qr_code && (
                <>
                  <QRCodeSVG value={selectedRequest.qr_code} size={256} />
                  <p className="text-sm text-muted-foreground text-center">
                    Pass ID: {selectedRequest.qr_code}
                  </p>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
        </TabsContent>

        <TabsContent value="profile">
          {user && <ProfileSection user={user} showHallSelection={true} />}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default HallAdminDashboard;
