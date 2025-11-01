import { Badge } from "@/components/ui/badge";

type Status = "pending" | "approved" | "declined" | "exited" | "returned";

interface StatusBadgeProps {
  status: Status;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const variants: Record<Status, string> = {
    pending: "bg-warning text-warning-foreground",
    approved: "bg-success text-success-foreground",
    declined: "bg-destructive text-destructive-foreground",
    exited: "bg-status-exited text-primary-foreground",
    returned: "bg-status-returned text-white",
  };

  return (
    <Badge className={variants[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};
