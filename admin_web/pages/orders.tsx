import { useEffect, useState } from "react";
import Head from "next/head";
import axios from "axios";
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
  Filter,
  Calendar,
  Phone,
  IndianRupee,
  ShoppingBag,
  Package,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  AlertCircle,
  Delete,
  Trash,
  Loader2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/router";

interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  gst: number;
}

interface Order {
  orderId: string;
  phone: string;
  machineId: string;
  mid?: string;
  ostatus: string;
  orderStatus?: string;
  amount: number;
  totalAmount?: number;
  orderDate?: string;
  createdAt: string;
  items?: OrderItem[];
}

interface OrderCounts {
  totAmt: number;
  GOLQty: number;
  PANQty: number;
  PWOQty: number;
}

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [orderIdFilter, setOrderIdFilter] = useState("");
  const [orderIdError, setOrderIdError] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [machineIdFilter, setMachineIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [minAmount, setMinAmount] = useState(30);
  const [maxAmount, setMaxAmount] = useState(1000);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Order counts
  const [orderCounts, setOrderCounts] = useState<OrderCounts>({
    totAmt: 0,
    GOLQty: 0,
    PANQty: 0,
    PWOQty: 0,
  });

  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    setCancelLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
      await axios.patch(`${baseUrl}/order/admin/${orderToCancel}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("Token")}`,
        },
      });
      toast.success("Order cancelled successfully");
      setShowCancelDialog(false);
      setOrderToCancel(null);
      fetchOrders();
    } catch (e: any) {
      console.error("Failed to cancel order:", e);
      toast.error(e.response?.data?.message || "Failed to cancel order");
    } finally {
      setCancelLoading(false);
    }
  };

  async function fetchOrders() {
    setSearchLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
      if (!baseUrl) throw new Error("Server URL not set");

      const res = await axios.get(`${baseUrl}/order/admin/all`, {
        params: {
          orderId: orderIdFilter || undefined,
          machineId: machineIdFilter || undefined,
          orderStatus: statusFilter !== "ALL" ? statusFilter : undefined,
          phone: phoneFilter || undefined,
          minAmt: minAmount,
          maxAmt: maxAmount,
          date: dateFilter || undefined,
          page,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("Token")}`,
        },
      });

      if (res.status === 200) {
        setOrders(res.data.result.orders || []);
        setTotalPages(res.data.result.numOfPages || 1);
        setOrderCounts(res.data.result.orderCounts || {
          totAmt: 0,
          GOLQty: 0,
          PANQty: 0,
          PWOQty: 0,
        });
      }
    } catch (error: any) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setSearchLoading(false);
      setLoading(false);
    }
  }

  const validateOrderId = (orderId: string): boolean => {
    if (!orderId) {
      setOrderIdError("");
      return true;
    }

    // MongoDB ObjectId is 24 hexadecimal characters
    if (orderId.length !== 24) {
      setOrderIdError("Order ID must be exactly 24 characters");
      return false;
    }

    if (!/^[a-fA-F0-9]{24}$/.test(orderId)) {
      setOrderIdError("Order ID must contain only hexadecimal characters (0-9, a-f)");
      return false;
    }

    setOrderIdError("");
    return true;
  };

  const handleSearch = () => {
    if (!validateOrderId(orderIdFilter)) {
      toast.error("Invalid Order ID format");
      return;
    }
    setPage(1);
    fetchOrders();
  };

  const handleClearFilters = () => {
    setOrderIdFilter("");
    setOrderIdError("");
    setPhoneFilter("");
    setMachineIdFilter("");
    setStatusFilter("ALL");
    setDateFilter("");
    setMinAmount(30);
    setMaxAmount(1000);
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status?.toUpperCase() || "";

    switch (normalizedStatus) {
      case "PENDING":
        return <Badge variant="warning" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">PENDING</Badge>;
      case "PAID":
        return <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">PAID</Badge>;
      case "PREPARING":
        return <Badge variant="warning" className="bg-orange-100 text-orange-800 hover:bg-orange-100">PREPARING</Badge>;
      case "COMPLETED":
        return <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100">COMPLETED</Badge>;
      case "CANCELLED":
      case "CANCELED":
        return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">CANCELLED</Badge>;
      case "READY":
      case "READY_FOR_PICKUP":
        return <Badge variant="default" className="bg-purple-100 text-purple-800 hover:bg-purple-100">READY</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderId?.toLowerCase().includes(query) ||
      order.phone?.toLowerCase().includes(query) ||
      order.machineId?.toLowerCase().includes(query) ||
      (order.mid && order.mid.toLowerCase().includes(query))
    );
  });

  return (
    <>
      <Head>
        <title>Orders - GolBot Admin</title>
      </Head>

      <AppLayout title="Orders" description="Manage and track all orders">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{orderCounts.totAmt.toLocaleString('en-IN')}</div>
                <p className="text-xs text-muted-foreground mt-1">From filtered orders</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Golgappa Orders
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderCounts.GOLQty}</div>
                <p className="text-xs text-muted-foreground mt-1">Total quantity</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pani Puri
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderCounts.PANQty}</div>
                <p className="text-xs text-muted-foreground mt-1">Total quantity</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pani Puri (No Onions)
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderCounts.PWOQty}</div>
                <p className="text-xs text-muted-foreground mt-1">Total quantity</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                  </CardTitle>
                  <CardDescription>Search and filter orders</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order ID</label>
                  <Input
                    placeholder="Search by order ID (24 characters)"
                    value={orderIdFilter}
                    onChange={(e) => {
                      setOrderIdFilter(e.target.value);
                      validateOrderId(e.target.value);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className={orderIdError ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {orderIdError && (
                    <div className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      <span>{orderIdError}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    placeholder="Search by phone"
                    value={phoneFilter}
                    onChange={(e) => setPhoneFilter(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Machine ID</label>
                  <Input
                    placeholder="Search by machine ID"
                    value={machineIdFilter}
                    onChange={(e) => setMachineIdFilter(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="PREPARING">Preparing</SelectItem>
                      <SelectItem value="READY">Ready</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount Range</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minAmount}
                      onChange={(e) => setMinAmount(parseInt(e.target.value) || 0)}
                      className="w-24"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(parseInt(e.target.value) || 1000)}
                      className="w-24"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Button onClick={handleSearch} disabled={searchLoading} className="w-full md:w-auto">
                  <Search className="mr-2 h-4 w-4" />
                  {searchLoading ? "Searching..." : "Search Orders"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Orders</CardTitle>
                  <CardDescription>
                    {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Machine ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 10 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-16">
                          <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <div className="relative">
                              <FileSearch className="h-20 w-20 opacity-10" strokeWidth={1.5} />
                              <ShoppingBag className="h-10 w-10 opacity-20 absolute top-5 left-5" strokeWidth={2} />
                            </div>
                            <div className="space-y-1">
                              <p className="text-lg font-semibold text-foreground">No orders found</p>
                              <p className="text-sm">
                                {orderIdFilter ? "No order matches the provided Order ID" :
                                  phoneFilter || machineIdFilter || statusFilter !== "ALL" || dateFilter ?
                                    "Try adjusting your filters to find orders" :
                                    "No orders available yet"}
                              </p>
                            </div>
                            {(orderIdFilter || phoneFilter || machineIdFilter || statusFilter !== "ALL" || dateFilter) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearFilters}
                                className="mt-2"
                              >
                                Clear all filters
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow key={order.orderId} className="hover:bg-muted/50">
                          <TableCell className="font-mono font-medium">
                            {order.orderId}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{order.phone}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            {order.mid || order.machineId}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(order.orderStatus || order.ostatus)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {new Date(order.createdAt || order.orderDate || '').toLocaleDateString('en-IN')}
                              </span>
                            </div>
                          </TableCell>
                           <TableCell className="text-right font-semibold">
                            ₹{(order.totalAmount || order.amount || 0).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={() => router.push(`/orders/${order.orderId}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              {['PENDING', 'PAID', 'OTP_VERIFIED', 'PREPARING', 'READY_FOR_PICKUP'].includes(order.orderStatus || order.ostatus || '') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    setOrderToCancel(order.orderId);
                                    setShowCancelDialog(true);
                                  }}
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
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
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || searchLoading}
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
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || searchLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Order</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this order? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={cancelLoading}>
                No
              </Button>
              <Button variant="destructive" onClick={handleCancelOrder} disabled={cancelLoading}>
                {cancelLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Yes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </>
  );
}
