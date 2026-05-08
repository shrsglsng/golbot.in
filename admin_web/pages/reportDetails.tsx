import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft,
  Mail,
  Copy,
  Package,
  Phone,
  Bot,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Receipt,
  Calendar,
  FileText,
  CreditCard,
} from "lucide-react";
import { ReportDetails, getReportById, updateReportStatus, markReportAsSeen } from "@/services/report";
import { toast } from "sonner";

function ReportDetailsPage() {
  const router = useRouter();
  const { reportId } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [report, setReport] = useState<ReportDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchReport() {
    if (!reportId || typeof reportId !== "string") return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await getReportById(reportId);
      setReport(data);

      // Mark as seen if not already
      if (!data.seen) {
        try {
          await markReportAsSeen(reportId, true);
        } catch (err) {
          console.error("Failed to mark report as seen:", err);
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch report:", error);
      setError(error.message || "Failed to load report");
      toast.error("Failed to load report details");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusUpdate(
    newStatus: "initiated" | "received" | "in_review" | "resolved"
  ) {
    if (!reportId || typeof reportId !== "string") return;

    setIsUpdating(true);
    try {
      await updateReportStatus(reportId, newStatus);
      await fetchReport();
      toast.success(`Report status updated to ${newStatus.replace("_", " ")}`);
    } catch (error: any) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  }

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  function getStatusBadge(status: string) {
    const statusConfig: {
      [key: string]: { variant: "default" | "secondary" | "success" | "warning" | "destructive"; icon: any };
    } = {
      initiated: { variant: "secondary", icon: Clock },
      received: { variant: "default", icon: CheckCircle2 },
      in_review: { variant: "warning", icon: AlertCircle },
      resolved: { variant: "success", icon: CheckCircle2 },
    };

    const config = statusConfig[status] || { variant: "secondary" as const, icon: Clock };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  }

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Loading Report... - GolBot Admin</title>
        </Head>
        <AppLayout>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </AppLayout>
      </>
    );
  }

  if (error || !report) {
    return (
      <>
        <Head>
          <title>Report Not Found - GolBot Admin</title>
        </Head>
        <AppLayout>
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <AlertCircle className="h-16 w-16 text-destructive opacity-20" />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h2>
              <p className="text-muted-foreground mb-4">{error || "The report you're looking for doesn't exist"}</p>
              <Button onClick={() => router.push("/reports")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Reports
              </Button>
            </div>
          </div>
        </AppLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Report {report.reportId} - GolBot Admin</title>
      </Head>

      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/reports")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Report {report.reportId}</h1>
                <p className="text-muted-foreground">View and manage report details</p>
              </div>
            </div>
            {getStatusBadge(report.status)}
          </div>

          {/* Status Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Report ID</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold font-mono">{report.reportId}</div>
                <p className="text-xs text-muted-foreground mt-1">Report identifier</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold capitalize">{report.status.replace("_", " ")}</div>
                <p className="text-xs text-muted-foreground mt-1">Current status</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Created</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-semibold">
                  {new Date(report.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(report.createdAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-semibold">
                  {new Date(report.updatedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(report.updatedAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* User Report Details (New) */}
              {(report.description || report.imgUrl) && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-primary" />
                      <CardTitle>User Report Details</CardTitle>
                    </div>
                    <CardDescription>Submitted by the user via in-app form</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {report.description && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">User Description</p>
                        <div className="bg-muted/30 p-4 rounded-lg border text-sm leading-relaxed whitespace-pre-wrap">
                          {report.description}
                        </div>
                      </div>
                    )}

                    {report.imgUrl && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Uploaded Image</p>
                        <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                          <img
                            src={report.imgUrl.startsWith('http') ? report.imgUrl : `${process.env.NEXT_PUBLIC_SERVER_URL}${report.imgUrl}`}
                            alt="Report evidence"
                            className="object-contain w-full h-full"
                          />
                        </div>
                        <Button variant="outline" size="sm" asChild className="w-full">
                          <a
                            href={report.imgUrl.startsWith('http') ? report.imgUrl : `${process.env.NEXT_PUBLIC_SERVER_URL}${report.imgUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open Original Image
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Email Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <CardTitle>Email Information</CardTitle>
                  </div>
                  <CardDescription>Report submission email details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email Address</p>
                      <p className="font-mono font-semibold text-blue-700">{report.emailAddress}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(report.emailAddress)}
                      title="Copy email address"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm font-medium mb-3">How to view the email thread:</p>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                      <li>Open your email client (Gmail, Outlook, etc.)</li>
                      <li>
                        Search for:{" "}
                        <Badge variant="outline" className="font-mono">
                          {report.reportId}
                        </Badge>
                      </li>
                      <li>
                        Or search for:{" "}
                        <Badge variant="outline" className="font-mono text-xs">
                          {report.emailAddress}
                        </Badge>
                      </li>
                      <li>View photos/videos attached to the email</li>
                    </ol>
                  </div>

                  {report.emailMetadata && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-semibold mb-3">Email Metadata</p>
                        <div className="space-y-2">
                          {report.emailMetadata.from && (
                            <div className="flex justify-between py-1">
                              <span className="text-sm text-muted-foreground">From:</span>
                              <span className="text-sm font-medium">{report.emailMetadata.from}</span>
                            </div>
                          )}
                          {report.emailMetadata.subject && (
                            <div className="flex justify-between py-1">
                              <span className="text-sm text-muted-foreground">Subject:</span>
                              <span className="text-sm font-medium">{report.emailMetadata.subject}</span>
                            </div>
                          )}
                          {report.emailMetadata.receivedAt && (
                            <div className="flex justify-between py-1">
                              <span className="text-sm text-muted-foreground">Received:</span>
                              <span className="text-sm font-medium">
                                {new Date(report.emailMetadata.receivedAt).toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Order Information */}
              {report.orderDetails && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <CardTitle>Order Information</CardTitle>
                    </div>
                    <CardDescription>Related order details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Order Number</p>
                        <p className="text-lg font-bold">#{report.orderDetails.orderCounter}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Order ID</p>
                        <p className="text-sm font-mono font-semibold">{report.orderId?.slice(-8)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Base Price</p>
                        <p className="font-semibold">₹{report.orderDetails.amount.price.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">GST</p>
                        <p className="font-semibold">₹{report.orderDetails.amount.gst.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-xl font-bold text-green-600">
                          ₹{report.orderDetails.amount.total.toFixed(2)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Order Status</p>
                        <Badge variant="outline" className="uppercase">
                          {report.orderDetails.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Items */}
              {report.orderDetails && report.orderDetails.items && report.orderDetails.items.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <CardTitle>Order Items</CardTitle>
                    </div>
                    <CardDescription>Items included in this order</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-center">Quantity</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">GST</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.orderDetails.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {item.name}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{item.quantity}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              ₹{item.priceAtOrderTime.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              ₹{item.gstAtOrderTime.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              ₹{((item.priceAtOrderTime + item.gstAtOrderTime) * item.quantity).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Separator className="my-4" />
                    <div className="flex justify-end">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-8">
                          <span className="text-lg font-semibold">Grand Total:</span>
                          <span className="text-2xl font-bold text-green-600">
                            ₹{report.orderDetails.amount.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Machine & User Info */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Machine Information */}
                {report.machineDetails && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        <CardTitle>Machine</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Machine ID</p>
                        <p className="font-mono font-bold text-lg">{report.machineDetails.mid}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-semibold">{report.machineDetails.location}</p>
                      </div>
                      {report.machineDetails.name && (
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-semibold">{report.machineDetails.name}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* User Information */}
                {report.userDetails && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <CardTitle>Customer</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-semibold text-lg">{report.userDetails.phone}</p>
                      </div>
                      {report.userDetails.email && (
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-semibold">{report.userDetails.email}</p>
                        </div>
                      )}
                      {report.userDetails.name && (
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-semibold">{report.userDetails.name}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Update Status</CardTitle>
                  <CardDescription>Change the report status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => handleStatusUpdate("received")}
                    disabled={isUpdating || report.status === "received"}
                    className="w-full bg-blue-500 hover:bg-blue-600"
                    variant={report.status === "received" ? "outline" : "default"}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Received
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate("in_review")}
                    disabled={isUpdating || report.status === "in_review"}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    variant={report.status === "in_review" ? "outline" : "default"}
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Mark as In Review
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate("resolved")}
                    disabled={isUpdating || report.status === "resolved"}
                    className="w-full bg-green-600 hover:bg-green-700"
                    variant={report.status === "resolved" ? "outline" : "default"}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Resolved
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => copyToClipboard(report.emailAddress)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Email Address
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => copyToClipboard(report.reportId)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Report ID
                  </Button>
                  {report.orderId && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => router.push(`/orders/${report.orderId}`)}
                    >
                      <Receipt className="mr-2 h-4 w-4" />
                      View Order Details
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}

export default ReportDetailsPage;
