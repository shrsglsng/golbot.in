import { useEffect, useState } from "react";
import Head from "next/head";
import axios from "axios";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  MessageSquare,
  Phone,
  Bot,
  Calendar,
  Image as ImageIcon,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

interface Feedback {
  oid: string;
  phone: string;
  machineId: string;
  reportedDate: string;
  description: string;
  imgUrl: string;
}

export default function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    oid: "",
    machineId: "",
    phone: "",
    reportedDate: "",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedbacks();
  }, [page]);

  async function fetchFeedbacks() {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
      if (!baseUrl) throw new Error("Server URL not set");

      const url = `${baseUrl}/admin/getreportIssues`;

      const res = await axios.get(url, {
        params: {
          orderId: filters.oid || undefined,
          machineId: filters.machineId || undefined,
          phone: filters.phone || undefined,
          reportedDate: filters.reportedDate || undefined,
          page,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("Token")}`,
        },
      });

      if (res.status === 200) {
        setFeedbacks(res.data.data.issues);
        setTotalPages(res.data.data.pagination.numOfPages);
      }
    } catch (error) {
      console.error("Failed to fetch feedbacks:", error);
      toast.error("Failed to load feedbacks");
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = () => {
    setPage(1);
    fetchFeedbacks();
  };

  const handleReset = () => {
    setFilters({
      oid: "",
      machineId: "",
      phone: "",
      reportedDate: "",
    });
    setSearchQuery("");
    setPage(1);
  };

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      feedback.oid.toLowerCase().includes(query) ||
      feedback.phone.toLowerCase().includes(query) ||
      feedback.machineId.toLowerCase().includes(query) ||
      feedback.description.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <Head>
        <title>Feedback - GolBot Admin</title>
      </Head>

      <AppLayout title="Feedback" description="View customer feedback and issue reports">
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
                  <CardDescription>Search and filter customer feedback</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order ID</label>
                  <Input
                    placeholder="Enter order ID"
                    value={filters.oid}
                    onChange={(e) => setFilters({ ...filters, oid: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    placeholder="Enter phone number"
                    value={filters.phone}
                    onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={filters.reportedDate}
                    onChange={(e) => setFilters({ ...filters, reportedDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Button onClick={handleSearch} className="w-full md:w-auto">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Feedbacks Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">
                  All Feedback ({filteredFeedbacks.length})
                </h2>
                <p className="text-sm text-muted-foreground">
                  Customer feedback and issue reports
                </p>
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

            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-32 w-full rounded-lg mb-4" />
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 opacity-20" />
                    <p className="text-lg font-medium">No feedback found</p>
                    <p className="text-sm">
                      {searchQuery
                        ? "Try adjusting your search query"
                        : "No customer feedback available"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredFeedbacks.map((feedback, index) => (
                  <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Image Section */}
                    {feedback.imgUrl && (
                      <div
                        className="relative aspect-video bg-muted cursor-pointer group"
                        onClick={() => setSelectedImage(feedback.imgUrl)}
                      >
                        <img
                          src={feedback.imgUrl}
                          alt={`Feedback for ${feedback.oid}`}
                          className="h-full w-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                          <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    )}

                    <CardHeader className="space-y-3">
                      {/* Order ID */}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {feedback.oid}
                        </Badge>
                      </div>

                      {/* Description */}
                      <div className="space-y-1">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {feedback.description || "No description provided"}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-0">
                      {/* Phone */}
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{feedback.phone}</span>
                      </div>

                      {/* Machine ID */}
                      <div className="flex items-center gap-2 text-sm">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">{feedback.machineId}</span>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(feedback.reportedDate).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

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

        {/* Image Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img
                src={selectedImage}
                alt="Feedback"
                className="max-w-full max-h-[90vh] rounded-lg"
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-4 right-4 bg-white"
                onClick={() => setSelectedImage(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </AppLayout>
    </>
  );
}
