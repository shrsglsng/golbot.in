import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Bell, Search, Menu, AlertCircle, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { getUnseenReportsCount, getAllReports, markReportAsSeen, Report } from "@/services/report";
import { toast } from "sonner";

interface AppHeaderProps {
  title?: string;
  description?: string;
  showSearch?: boolean;
}

export function AppHeader({ title, description, showSearch = true }: AppHeaderProps) {
  const router = useRouter();
  const [unseenCount, setUnseenCount] = useState(0);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUnseenCount();
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnseenCount, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchUnseenCount() {
    try {
      const count = await getUnseenReportsCount();
      console.log("Unseen reports count:", count);
      setUnseenCount(count);
    } catch (error) {
      console.error("Failed to fetch unseen count:", error);
      // Set to 0 on error to avoid showing stale data
      setUnseenCount(0);
    }
  }

  async function fetchRecentReports() {
    if (loading) return;
    setLoading(true);
    try {
      const result = await getAllReports({ seen: "false", page: 1 });
      setRecentReports(result.reports.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch recent reports:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  async function handleReportClick(report: Report) {
    try {
      // Mark as seen
      await markReportAsSeen(report.reportId, true);
      // Update local state
      setUnseenCount(prev => Math.max(0, prev - 1));
      setRecentReports(prev => prev.filter(r => r.reportId !== report.reportId));
      // Navigate to report details
      router.push(`/reportDetails?reportId=${report.reportId}`);
    } catch (error) {
      console.error("Failed to mark report as seen:", error);
      // Still navigate even if marking as seen fails
      router.push(`/reportDetails?reportId=${report.reportId}`);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "initiated":
        return "text-gray-600";
      case "received":
        return "text-blue-600";
      case "in_review":
        return "text-yellow-600";
      case "resolved":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  }

  function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>

        {/* Page Title */}
        {title && (
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )}

        {/* Search Bar */}
        {showSearch && !title && (
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders, machines, items..."
                className="pl-9"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu onOpenChange={(open) => open && fetchRecentReports()}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unseenCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                  >
                    {unseenCount > 9 ? "9+" : unseenCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unseenCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unseenCount} new
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : recentReports.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-20" />
                  <p className="text-sm text-muted-foreground">No new notifications</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You&apos;re all caught up!
                  </p>
                </div>
              ) : (
                <>
                  {recentReports.map((report) => (
                    <DropdownMenuItem
                      key={report.reportId}
                      onClick={() => handleReportClick(report)}
                      className="cursor-pointer"
                    >
                      <div className="flex gap-3 w-full">
                        <div className="flex-shrink-0 mt-1">
                          <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">
                              New Report {report.reportId.slice(0, 12)}...
                            </p>
                            {!report.seen && (
                              <div className="h-2 w-2 rounded-full bg-orange-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className={`text-xs ${getStatusColor(report.status)}`}>
                              {report.status.replace("_", " ").toUpperCase()}
                            </p>
                            {report.orderCounter && (
                              <span className="text-xs text-muted-foreground">
                                • Order #{report.orderCounter}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(report.createdAt)}
                          </div>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/reports")}
                    className="cursor-pointer justify-center text-center"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View all reports
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
