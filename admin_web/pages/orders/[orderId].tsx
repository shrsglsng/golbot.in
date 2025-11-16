import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft,
  Package,
  Phone,
  Bot,
  Calendar,
  CreditCard,
  Key,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  priceAtOrderTime: number;
  gstAtOrderTime: number;
}

interface OrderDetails {
  orderId: string; // This is the _id
  orderCounter?: number;
  phone: string;
  machineId: string; // This is the mid
  machineName?: string;
  orderStatus: string; // NOT ostatus
  orderDate: string; // NOT createdAt
  amount: number; // This is the total amount
  orderCompleted: boolean;
  orderOtp?: string;
  paymentMethod?: string;
  transactionId?: string;
  items?: OrderItem[];
}

export default function OrderDetails() {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId && typeof orderId === "string") {
      fetchOrderDetails(orderId);
    }
  }, [orderId]);

  async function fetchOrderDetails(id: string) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
      if (!baseUrl) throw new Error("Server URL not set");

      const res = await axios.get(`${baseUrl}/order/admin/all`, {
        params: { orderId: id },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("Token")}`,
        },
      });

      if (res.status === 200 && res.data.result.orders.length > 0) {
        const orderData = res.data.result.orders[0];
        console.log("Order data received:", orderData);
        setOrder(orderData);
      } else {
        setError("Order not found");
      }
    } catch (e: any) {
      console.error("Failed to fetch order details:", e);
      setError("Failed to load order details. Please try again.");
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status?: string) {
    if (!status) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          PENDING
        </Badge>
      );
    }

    const statusConfig: {
      [key: string]: { variant: "default" | "secondary" | "success" | "warning" | "destructive"; icon: any };
    } = {
      PENDING: { variant: "secondary", icon: Clock },
      PAID: { variant: "success", icon: CheckCircle2 },
      OTP_VERIFIED: { variant: "default", icon: CheckCircle2 },
      PREPARING: { variant: "warning", icon: Clock },
      READY_FOR_PICKUP: { variant: "default", icon: Package },
      COMPLETED: { variant: "success", icon: CheckCircle2 },
      CANCELLED: { variant: "destructive", icon: AlertCircle },
      FAILED: { variant: "destructive", icon: AlertCircle },
    };

    const config = statusConfig[status] || { variant: "secondary" as const, icon: Clock };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace(/_/g, " ")}
      </Badge>
    );
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Order... - GolBot Admin</title>
        </Head>
        <AppLayout>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </AppLayout>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Head>
          <title>Order Not Found - GolBot Admin</title>
        </Head>
        <AppLayout>
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <AlertCircle className="h-16 w-16 text-destructive opacity-20" />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
              <p className="text-muted-foreground mb-4">{error || "The order you're looking for doesn't exist"}</p>
              <Button onClick={() => router.push("/orders")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Orders
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
        <title>Order #{order.orderCounter || order.orderId.slice(-6)} - GolBot Admin</title>
      </Head>

      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/orders")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Order #{order.orderCounter || order.orderId.slice(-6)}
                </h1>
                <p className="text-muted-foreground">View order details and status</p>
              </div>
            </div>
            {getStatusBadge(order.orderStatus)}
          </div>

          {/* Order Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₹{(order.amount || 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(order.items?.length || 0)} item{(order.items?.length || 0) !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Customer</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{order.phone || "N/A"}</div>
                <p className="text-xs text-muted-foreground mt-1">Phone number</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Machine</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold font-mono">{order.machineId}</div>
                <p className="text-xs text-muted-foreground mt-1">{order.machineName || "Machine ID"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Order Date</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-semibold">
                  {new Date(order.orderDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(order.orderDate).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <CardTitle>Order Items</CardTitle>
              </div>
              <CardDescription>Items included in this order</CardDescription>
            </CardHeader>
            <CardContent>
              {order.items && order.items.length > 0 ? (
                <>
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
                      {order.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {item.name || `Item ${item.itemId?.slice(-6) || index + 1}`}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{item.quantity}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{(item.priceAtOrderTime || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            ₹{(item.gstAtOrderTime || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ₹{(((item.priceAtOrderTime || 0) + (item.gstAtOrderTime || 0)) * (item.quantity || 0)).toFixed(2)}
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
                          ₹{(order.amount || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No items found in this order</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Status Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                <CardTitle>Order Status</CardTitle>
              </div>
              <CardDescription>Current order status and completion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div>{getStatusBadge(order.orderStatus)}</div>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <Badge variant={order.orderCompleted ? "success" : "secondary"}>
                    {order.orderCompleted ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Payment & Transaction Info */}
            {(order.orderOtp || order.transactionId) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    <CardTitle>Payment Details</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.orderOtp && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Order OTP</p>
                      </div>
                      <p className="text-2xl font-mono font-bold tracking-wider">{order.orderOtp}</p>
                    </div>
                  )}
                  {order.transactionId && (
                    <div>
                      <p className="text-sm font-medium mb-1">Transaction ID</p>
                      <p className="text-sm font-mono text-muted-foreground break-all">
                        {order.transactionId}
                      </p>
                    </div>
                  )}
                  {order.paymentMethod && (
                    <div>
                      <p className="text-sm font-medium mb-1">Payment Method</p>
                      <Badge variant="outline">{order.paymentMethod}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <CardTitle>Order Timeline</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Order Created</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.orderDate).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Order Status</p>
                    <p className="text-xs text-muted-foreground">
                      {order.orderStatus} {order.orderCompleted && "(Completed)"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID (Database)</span>
                  <span className="font-mono text-xs">{order.orderId}</span>
                </div>
                {order.orderCounter && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Number</span>
                    <span className="font-semibold">#{order.orderCounter}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </>
  );
}
