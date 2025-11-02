import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

interface Hall {
  id: string;
  name: string;
}

interface ProfileSectionProps {
  user: User;
  showHallSelection?: boolean;
}

export const ProfileSection = ({ user, showHallSelection = false }: ProfileSectionProps) => {
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [hallId, setHallId] = useState("");
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
    if (showHallSelection) {
      fetchHalls();
    }
  }, [user.id, showHallSelection]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setFullName(data.full_name || "");
      setStudentId(data.student_id || "");
      setPhoneNumber(data.phone_number || "");
      setHallId(data.hall_id || "");
    }
  };

  const fetchHalls = async () => {
    const { data, error } = await supabase
      .from("halls")
      .select("id, name")
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load halls",
        variant: "destructive",
      });
      return;
    }

    setHalls(data || []);
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        student_id: studentId,
        phone_number: phoneNumber,
        hall_id: showHallSelection ? hallId : undefined,
      })
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Profile updated successfully",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Manage your account information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user.email} disabled />
        </div>
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>
        <div>
          <Label htmlFor="studentId">Student ID</Label>
          <Input
            id="studentId"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="Enter your student ID"
          />
        </div>
        <div>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter your phone number"
          />
        </div>
        {showHallSelection && (
          <div>
            <Label htmlFor="hall">Hall</Label>
            <Select value={hallId} onValueChange={setHallId}>
              <SelectTrigger>
                <SelectValue placeholder="Select your hall" />
              </SelectTrigger>
              <SelectContent>
                {halls.map((hall) => (
                  <SelectItem key={hall.id} value={hall.id}>
                    {hall.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button onClick={handleUpdateProfile} disabled={loading}>
          {loading ? "Updating..." : "Update Profile"}
        </Button>
      </CardContent>
    </Card>
  );
};
