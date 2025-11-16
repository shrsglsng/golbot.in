import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Phone,
  Bot,
  EyeOff,
  Circle,
} from "lucide-react";
import { toast } from "sonner";
import { Report, getAllReports, markReportAsSeen } from "@/services/report";

export default function Reports() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "ALL",
    orderId: "",
    machineId: "",
    seen: "ALL",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReports();
  }, [page]);

  async function fetchReports() {
    setLoading(true);
    try {
      const params: any = { page };

      if (filters.status && filters.status !== "ALL") {
        params.status = filters.status;
      }
      if (filters.orderId) {
        params.orderId = filters.orderId;
      }
      if (filters.machineId) {
        params.machineId = filters.machineId;
      }
      if (filters.seen && filters.seen !== "ALL") {
        params.seen = filters.seen === "SEEN" ? "true" : "false";
      }

      const result = await getAllReports(params);
      setReports(result.reports);
      setTotalPages(result.pagination.numOfPages);
    } catch (error: any) {
      console.error("Failed to fetch reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = () => {
    setPage(1);
    fetchReports();
  };

  const handleReset = () => {
    setFilters({
      status: "ALL",
      orderId: "",
      machineId: "",
      seen: "ALL",
    });
    setSearchQuery("");
    setPage(1);
  };

  const handleToggleSeen = async (reportId: string, currentSeen: boolean) => {
    try {
      await markReportAsSeen(reportId, !currentSeen);
      toast.success(`Report marked as ${!currentSeen ? "seen" : "unseen"}`);
      fetchReports();
    } catch (error) {
      console.error("Failed to toggle seen status:", error);
      toast.error("Failed to update seen status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "initiated":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <Clock className="mr-1 h-3 w-3" />
            Initiated
          </Badge>
        );
      case "received":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <AlertCircle className="mr-1 h-3 w-3" />
            Received
          </Badge>
        );
      case "in_review":
        return (
          <Badge variant="warning" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <AlertCircle className="mr-1 h-3 w-3" />
            In Review
          </Badge>
        );
      case "resolved":
        return (
          <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Resolved
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredReports = reports.filter((report) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.reportId.toLowerCase().includes(query) ||
      report.orderId?.toLowerCase().includes(query) ||
      report.machineId?.toLowerCase().includes(query) ||
      report.userPhone?.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <Head>
        <title>Reports - GolBot Admin</title>
      </Head>

      <AppLayout title="Reports" description="View and manage customer issue reports">
        <div className="space-y-6">
          {/* Filters Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                  </CardTitle>
                  <CardDescription>Search and filter issue reports</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="initiated">Initiated</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Seen Status</label>
                  <Select value={filters.seen} onValueChange={(value) => setFilters({ ...filters, seen: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="UNSEEN">Unseen</SelectItem>
                      <SelectItem value="SEEN">Seen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Order ID</label>
                  <Input
                    placeholder="Enter order ID"
                    value={filters.orderId}
                    onChange={(e) => setFilters({ ...filters, orderId: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Machine ID</label>
                  <Input
                    placeholder="Enter machine ID"
                    value={filters.machineId}
                    onChange={(e) => setFilters({ ...filters, machineId: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>

                <div className="flex items-end">
                  <Button onClick={handleSearch} className="w-full">
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Reports</CardTitle>
                  <CardDescription>
                    {filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""} found
                  </CardDescription>
                </div>
                <div className="relative flex-1 max-w-sm ml-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Quick search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report ID</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Machine</TableHead>
                    <TableHead>User Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Seen</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <AlertCircle className="h-12 w-12 opacity-20" />
                          <p className="text-lg font-medium">No reports found</p>
                          <p className="text-sm">Try adjusting your filters or search query</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports.map((report) => (
                      <TableRow
                        key={report.reportId}
                        className={`hover:bg-muted/50 ${!report.seen ? 'bg-orange-50/30' : ''}`}
                      >
                        <TableCell className="font-mono font-medium text-sm">
                          <div className="flex items-center gap-2">
                            {!report.seen && (
                              <div className="h-2 w-2 rounded-full bg-orange-500 flex-shrink-0" />
                            )}
                            <span>{report.reportId.slice(0, 8)}...</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {report.orderId ? (
                            <span className="font-mono text-sm">
                              #{report.orderCounter || report.orderId.slice(-6)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {report.machineId ? (
                            <div className="flex items-center gap-2">
                              <Bot className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-mono text-sm">{report.machineId}</div>
                                {report.machineLocation && (
                                  <div className="text-xs text-muted-foreground">
                                    {report.machineLocation}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {report.userPhone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{report.userPhone}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleSeen(report.reportId, report.seen)}
                            className="gap-2"
                          >
                            {report.seen ? (
                              <>
                                <Eye className="h-4 w-4 text-green-600" />
                                <span className="text-xs text-green-600">Seen</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-4 w-4 text-orange-600" />
                                <span className="text-xs text-orange-600">Unseen</span>
                              </>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(report.createdAt).toLocaleString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/reportDetails?reportId=${report.reportId}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-2 px-4">
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={page}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= totalPages) {
                        setPage(val);
                      }
                    }}
                    className="w-16 text-center"
                  />
                  <span className="text-sm text-muted-foreground">of {totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </>
  );
}
