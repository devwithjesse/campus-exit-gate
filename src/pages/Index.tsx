import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GraduationCap, Shield, Users, QrCode } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">CEMS</h1>
              <p className="text-xs text-muted-foreground">Campus Exit Management</p>
            </div>
          </div>
          <Button onClick={() => navigate("/auth")}>Get Started</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Campus Exit Management System
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Streamline campus exit requests and approvals at Babcock University
          </p>
          <Button size="lg" onClick={() => navigate("/auth")}>
            Access Portal
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center p-6 rounded-lg border bg-card">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Student Portal</h3>
            <p className="text-muted-foreground">
              Submit exit requests and track approval status in real-time
            </p>
          </div>

          <div className="text-center p-6 rounded-lg border bg-card">
            <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Admin Review</h3>
            <p className="text-muted-foreground">
              Hall administrators review and approve exit requests efficiently
            </p>
          </div>

          <div className="text-center p-6 rounded-lg border bg-card">
            <div className="bg-success/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-3">QR Verification</h3>
            <p className="text-muted-foreground">
              Security officers verify passes instantly with QR codes
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Babcock University - Campus Exit Management System</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
