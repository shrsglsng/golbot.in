import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail } from "lucide-react";
import { startReport, openMailtoLink } from "../services/report";
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
  const [emailOpened, setEmailOpened] = useState(false);

  const handleReportIssue = async () => {
    try {
      setIsLoading(true);

      // Start the report
      const { reportId, mailtoLink, recipientEmail, isExisting } = await startReport({
        orderId,
        machineId,
      });

      console.log("Report started:", { reportId, recipientEmail, isExisting });

      // Open the mailto link
      const opened = openMailtoLink(mailtoLink);

      if (opened) {
        setEmailOpened(true);
        if (isExisting) {
          toast.info(
            "Using Existing Report",
            `Report #${reportId} was already created. Opening email app...`
          );
        } else {
          toast.success(
            "Email App Opening",
            `Report #${reportId} created. Your email app should open now.`
          );
        }
      } else {
        toast.info(
          "Email App Not Opening?",
          `Please manually email to: ${recipientEmail}`
        );
      }
    } catch (error: any) {
      console.error("Failed to start report:", error);
      toast.error(
        "Failed to Start Report",
        error.message || "Please try again later"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Button
        variant={variant}
        size={size}
        onClick={handleReportIssue}
        disabled={isLoading}
        className={`w-full ${className}`}
      >
        {showIcon && <AlertTriangle className="h-4 w-4" />}
        {isLoading ? "Opening..." : "Report an Issue"}
      </Button>

      {emailOpened && (
        <div className="mt-4 p-4 border border-amber-300 bg-amber-50 rounded-lg text-sm">
          <div className="flex gap-2 mb-2">
            <Mail className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-900 mb-2">
                Email app didn't open?
              </p>
              <ul className="text-amber-800 space-y-1 text-xs">
                <li>• Tap the button again to retry</li>
                <li>• Check if popup blockers are enabled</li>
                <li>• Contact support if the issue persists</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
