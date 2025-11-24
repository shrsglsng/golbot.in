import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../shared/navbar";
import { getOrderHistory, OrderHistoryItem } from "../services/order";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportIssueButton } from "@/components/ReportIssueButton";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Receipt,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface OrderCardProps {
  order: OrderHistoryItem;
}

function OrderCard({ order }: OrderCardProps) {
  const router = useRouter();

  const statusConfig = {
    PENDING: { icon: Clock, color: "text-gray-700", bg: "bg-gray-100", badge: "secondary", label: "Pending Payment" },
    PAYMENT_FAILED: { icon: XCircle, color: "text-red-700", bg: "bg-red-100", badge: "destructive", label: "Payment Failed" },
    PAID: { icon: CheckCircle2, color: "text-blue-700", bg: "bg-blue-100", badge: "default", label: "Payment Confirmed" },
    OTP_VERIFIED: { icon: Package, color: "text-indigo-700", bg: "bg-indigo-100", badge: "default", label: "OTP Verified" },
    PREPARING: { icon: Loader2, color: "text-orange-700", bg: "bg-orange-100", badge: "default", label: "Preparing" },
    READY_FOR_PICKUP: { icon: Package, color: "text-green-700", bg: "bg-green-100", badge: "default", label: "Ready for Pickup" },
    COMPLETED: { icon: CheckCircle2, color: "text-green-700", bg: "bg-green-100", badge: "default", label: "Completed" },
    CANCELLED: { icon: XCircle, color: "text-red-700", bg: "bg-red-100", badge: "destructive", label: "Cancelled" },
  };

  const status = statusConfig[order.orderStatus as keyof typeof statusConfig] || statusConfig.PENDING;
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

  const handleOrderClick = () => {
    // Store order data in sessionStorage for detail page
    sessionStorage.setItem(`order_${order.oid}`, JSON.stringify(order));
    router.push(`/orders/${order.oid}`);
  };

  return (
    <Card className="hover:shadow-lg transition-all group">
      <CardContent className="p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            {/* Status Icon */}
            <div className={`p-2.5 rounded-xl ${status.bg} flex-shrink-0`}>
              <StatusIcon
                className={`h-5 w-5 ${status.color} ${order.orderStatus === "PREPARING" ? "animate-spin" : ""}`}
                strokeWidth={2.5}
              />
            </div>

            {/* Order Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg">Order #{order.orderCounter}</h3>
                <Badge variant={status.badge as any} className="text-xs">
                  {status.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDate(order.createdAt)} • {formatTime(order.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Details Grid */}
        <div className="space-y-3">
          {/* Machine */}
          {order.machineId && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium">{order.machineId}</span>
                {order.machineLocation && (
                  <span className="text-muted-foreground ml-2">• {order.machineLocation}</span>
                )}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">Total Amount</span>
            <span className="text-xl font-bold text-primary">
              ₹{order.amount?.total?.toFixed(0) || "0"}
            </span>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleOrderClick}
          >
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <ReportIssueButton
            orderId={order.oid}
            machineId={order.machineId || ''}
            variant="outline"
            size="sm"
            className="flex-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyOrdersPage() {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("Token");
    if (!token) {
      toast.error(
        "Login Required",
        "Please login to view your order history"
      );
      router.replace("/auth/login?redirect=/myOrders");
      return;
    }
    setIsAuthenticated(true);
  }, []);

  // Fetch orders when authenticated and page changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [page, isAuthenticated]);

  const fetchOrders = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const result = await getOrderHistory(page, 10);
      setOrders(result.orders);
      setTotalPages(result.pagination.numOfPages);
      setTotalOrders(result.pagination.total);
    } catch (error: any) {
      console.error("Failed to fetch orders:", error);

      if (error.message === "AUTHENTICATION_REQUIRED") {
        toast.error(
          "Session Expired",
          "Please login again"
        );
        localStorage.removeItem("Token");
        router.replace("/auth/login?redirect=/myOrders");
        return;
      }

      toast.error(
        "Error",
        "Failed to load order history. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render page content until auth check is complete
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>My Orders - GolBot</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>My Orders - GolBot</title>
        <meta name="description" content="View your order history" />
      </Head>

      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="w-full flex justify-center">
          <div className="w-full md:w-1/2 lg:w-1/4 min-h-screen">
            <div className="pt-[72px]">
              {/* Header */}
              <div className="bg-background sticky top-[72px] z-10 border-b shadow-sm">
                <div className="px-4 py-4">
                  <h1 className="text-2xl font-bold">My Orders</h1>
                  {!isLoading && totalOrders > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {totalOrders} {totalOrders === 1 ? 'order' : 'orders'}
                    </p>
                  )}
                </div>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-24">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
                    <p className="font-semibold text-lg">Loading your orders...</p>
                    <p className="text-sm text-muted-foreground">Please wait</p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && orders.length === 0 && (
                <div className="px-4 py-16">
                  <Card className="shadow-lg">
                    <CardContent className="p-12 text-center">
                      <div className="space-y-6">
                        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-2xl font-bold">No Orders Yet</h2>
                          <p className="text-muted-foreground max-w-sm mx-auto">
                            Start your first order by scanning a QR code or entering a machine code
                          </p>
                        </div>
                        <Button
                          onClick={() => router.push("/order")}
                          size="lg"
                          className="mt-4 h-12 px-8"
                        >
                          Start New Order
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Orders List */}
              {!isLoading && orders.length > 0 && (
                <>
                  <div className="px-4 py-4 space-y-3">
                    {orders.map((order) => (
                      <OrderCard key={order.oid} order={order} />
                    ))}
                  </div>

                  {/* Pagination */}
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
