import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/router";
import { toast } from "@/hooks/use-toast";

interface ReportIssueButtonProps {
  orderId?: string;
  machineId?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
}

export function ReportIssueButton({
  orderId,
  machineId,
  variant = "outline",
  size = "default",
  className = "",
  showIcon = true,
}: ReportIssueButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleReportIssue = () => {
    if (!orderId || !machineId) {
      toast.error("Error", "Missing order or machine information");
      return;
    }

    setIsLoading(true);
    router.push(`/${machineId}/reportIssue?oid=${orderId}`);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleReportIssue}
      disabled={isLoading}
      className={`w-full ${className}`}
    >
      {showIcon && <AlertTriangle className="h-4 w-4 mr-2" />}
      {isLoading ? "Opening..." : "Report an Issue"}
    </Button>
  );
}

