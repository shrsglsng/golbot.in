import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../shared/navbar";
import { getMyReports } from "../services/report";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Receipt,
  Mail,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ReportItem {
  _id: string;
  reportId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  orderId?: string;
  machineId?: {
    mid: string;
    location: string;
  };
  oid?: {
    orderCounter: number;
    createdAt: string;
    status: string;
    amount: {
      total: number;
    };
  };
}

function ReportCard({ report }: { report: ReportItem }) {
  const router = useRouter();

  const statusConfig: Record<string, { icon: any, color: string, bg: string, badge: any, label: string }> = {
    initiated: { icon: Clock, color: "text-white", bg: "bg-[#ff6739]", badge: "outline" as any, label: "Initiated" },
    received: { icon: CheckCircle2, color: "text-blue-700", bg: "bg-blue-100", badge: "default", label: "Received" },
    in_review: { icon: AlertCircle, color: "text-yellow-700", bg: "bg-yellow-100", badge: "warning", label: "In Review" },
    resolved: { icon: CheckCircle2, color: "text-green-700", bg: "bg-green-100", badge: "success", label: "Resolved" },
  };

  const status = statusConfig[report.status] || statusConfig.initiated;
  const StatusIcon = status.icon;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="hover:shadow-lg transition-all group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2.5 rounded-xl ${status.bg} flex-shrink-0`}>
              <StatusIcon
                className={`h-5 w-5 ${status.color}`}
                strokeWidth={2.5}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg">#{report.reportId.slice(0, 8)}</h3>
                <Badge variant={status.badge} className="text-xs">
                  {status.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(report.createdAt)} • {formatTime(report.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-3">
          {report.oid && (
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Related Order: <span className="font-medium">#{report.oid.orderCounter}</span>
              </span>
            </div>
          )}

          {report.machineId && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium">{report.machineId.mid}</span>
                <span className="text-muted-foreground ml-2">• {report.machineId.location}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Reference ID: {report.reportId}
            </span>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}

export default function MyReportsPage() {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("Token");
    if (!token) {
      toast.error(
        "Login Required",
        "Please login to view your report history"
      );
      router.replace("/auth/login?redirect=/myReports");
      return;
    }
    setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchReports();
    }
  }, [page, isAuthenticated]);

  const fetchReports = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const result = await getMyReports(page, 10);
      setReports(result.reports);
      setTotalPages(result.pagination.numOfPages);
      setTotalReports(result.pagination.total);
    } catch (error: any) {
      console.error("Failed to fetch reports:", error);

      if (error.message === "AUTHENTICATION_REQUIRED") {
        toast.error(
          "Session Expired",
          "Please login again"
        );
        localStorage.removeItem("Token");
        router.replace("/auth/login?redirect=/myReports");
        return;
      }

      toast.error(
        "Error",
        "Failed to load report history. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Reports - GolBot</title>
        <meta name="description" content="View your reported issues" />
      </Head>

      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="w-full flex justify-center">
          <div className="w-full md:w-5/6 lg:w-4/6 xl:w-1/2 min-h-screen">
            <div className="pt-[72px]">
              <div className="bg-background sticky top-[72px] z-10 border-b shadow-sm">
                <div className="px-4 py-4">
                  <h1 className="text-2xl font-bold">My Reports</h1>
                  {!isLoading && totalReports > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {totalReports} {totalReports === 1 ? 'report' : 'reports'}
                    </p>
                  )}
                </div>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center py-24">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
                    <p className="font-semibold text-lg">Loading your reports...</p>
                  </div>
                </div>
              )}

              {!isLoading && reports.length === 0 && (
                <div className="px-4 py-16">
                  <Card className="shadow-lg">
                    <CardContent className="p-12 text-center">
                      <div className="space-y-6">
                        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto">
                          <AlertCircle className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-2xl font-bold">No Issues Reported</h2>
                          <p className="text-muted-foreground max-w-sm mx-auto">
                            If you have any problems with your order, you can report them here.
                          </p>
                        </div>
                        <Button
                          onClick={() => router.push("/myOrders")}
                          size="lg"
                          className="mt-4 h-12 px-8"
                        >
                          View My Orders
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {!isLoading && reports.length > 0 && (
                <>
                  <div className="px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reports.map((report) => (
                      <ReportCard key={report._id} report={report} />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="px-4 pb-6">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Page {page} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Prev
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
