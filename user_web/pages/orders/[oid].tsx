import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../../shared/navbar";
import QRCode from "react-qr-code";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  MapPin,
  Receipt,
  QrCode as QrCodeIcon,
  AlertTriangle,
  ShoppingCart,
  CreditCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OrderDetailPage() {
  const router = useRouter();
  const { oid } = router.query;
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRetryingPayment, setIsRetryingPayment] = useState(false);

  // Fetch fresh order data from API
  const fetchOrderData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/order/${oid}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("Token")}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Authentication Required", "Please login to view order details");
          router.replace("/auth/login");
          return null;
        }
        if (response.status === 404) {
          return null;
        }
        throw new Error("Failed to fetch order details");
      }

      const data = await response.json();
      const orderData = data.data.order;

      // Update sessionStorage with fresh data
      sessionStorage.setItem(`order_${oid}`, JSON.stringify(orderData));

      return orderData;
    } catch (error) {
      console.error("Error fetching order:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!oid) return;

    const loadOrderDetails = async () => {
      setIsLoading(true);
      try {
        // First, try to get order data from sessionStorage for immediate display
        const cachedOrderData = sessionStorage.getItem(`order_${oid}`);

        if (cachedOrderData) {
          const orderData = JSON.parse(cachedOrderData);
          setOrder(orderData);
        }

        // Then fetch fresh data from API
        const freshOrderData = await fetchOrderData();

        if (freshOrderData) {
          setOrder(freshOrderData);
        } else if (!cachedOrderData) {
          // No cached data and failed to fetch
          toast.error("Order Not Found", "Please access this order from your order history");
          router.replace("/myOrders");
        }
      } catch (error) {
        console.error("Error loading order:", error);
        toast.error("Error", "Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderDetails();
  }, [oid]);

  // Polling for active orders
  useEffect(() => {
    if (!order) return;

    // Active statuses that need polling
    const activeStatuses = ['PAID', 'OTP_VERIFIED', 'PREPARING', 'READY_FOR_PICKUP'];

    if (activeStatuses.includes(order.orderStatus)) {
      // Poll every 3 seconds for active orders
      const interval = setInterval(async () => {
        const freshData = await fetchOrderData();
        if (freshData) {
          setOrder(freshData);

          // Stop polling if order is completed or cancelled
          if (!activeStatuses.includes(freshData.orderStatus)) {
            clearInterval(interval);
            setPollingInterval(null);
          }
        }
      }, 3000);

      setPollingInterval(interval);

      return () => {
        clearInterval(interval);
      };
    }
  }, [order?.orderStatus, oid]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const statusConfig = {
    PENDING: {
      icon: Clock,
      color: "text-gray-700",
      bg: "bg-gray-100",
      gradient: "from-gray-500 via-gray-600 to-slate-600",
      badge: "secondary",
      label: "Pending Payment",
      description: "Awaiting payment confirmation"
    },
    PAYMENT_FAILED: {
      icon: XCircle,
      color: "text-red-700",
      bg: "bg-red-100",
      gradient: "from-red-500 via-red-600 to-rose-600",
      badge: "destructive",
      label: "Payment Failed",
      description: "Payment was not successful. No charges were made to your account."
    },
    PAID: {
      icon: CheckCircle2,
      color: "text-blue-700",
      bg: "bg-blue-100",
      gradient: "from-blue-500 via-blue-600 to-indigo-600",
      badge: "default",
      label: "Payment Confirmed",
      description: "Your payment has been successfully processed"
    },
    OTP_VERIFIED: {
      icon: Package,
      color: "text-indigo-700",
      bg: "bg-indigo-100",
      gradient: "from-indigo-500 via-indigo-600 to-purple-600",
      badge: "default",
      label: "OTP Verified",
      description: "Waiting for machine to start preparation"
    },
    PREPARING: {
      icon: Loader2,
      color: "text-orange-700",
      bg: "bg-orange-100",
      gradient: "from-orange-500 via-orange-600 to-amber-600",
      badge: "default",
      label: "Preparing",
      description: "Your order is being freshly prepared"
    },
    READY_FOR_PICKUP: {
      icon: Package,
      color: "text-green-700",
      bg: "bg-green-100",
      gradient: "from-green-500 via-green-600 to-emerald-600",
      badge: "default",
      label: "Ready for Pickup",
      description: "Your order is ready! Please collect it"
    },
    COMPLETED: {
      icon: CheckCircle2,
      color: "text-green-700",
      bg: "bg-green-100",
      gradient: "from-green-500 via-green-600 to-emerald-600",
      badge: "default",
      label: "Completed",
      description: "Order successfully completed. Enjoy your meal!"
    },
    CANCELLED: {
      icon: XCircle,
      color: "text-red-700",
      bg: "bg-red-100",
      gradient: "from-red-500 via-red-600 to-rose-600",
      badge: "destructive",
      label: "Cancelled",
      description: "This order has been cancelled"
    },
  };

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

  const validateAndGenerateQR = (order: any) => {
    if (!order || !order.orderOtp) return null;

    const otpString = String(order.orderOtp);
    if (otpString.length < 4 || otpString.length > 6) return null;

    return {
      otp: otpString,
      orderId: order.oid || order.id || order._id,
      timestamp: Date.now(),
    };
  };

  const getOrderSteps = (orderStatus: string) => {
    // For payment failed orders, show simplified journey
    if (orderStatus === 'PAYMENT_FAILED') {
      return [
        { status: 'PENDING', label: 'Order Placed', icon: Receipt },
        { status: 'PAYMENT_FAILED', label: 'Payment Failed', icon: XCircle },
      ];
    }

    // For cancelled orders, show the actual journey based on statusHistory
    if (orderStatus === 'CANCELLED') {
      const steps = [
        { status: 'PENDING', label: 'Order Placed', icon: Receipt },
      ];

      // Add steps based on statusHistory to show what was actually completed
      const statusHistory = order?.statusHistory || [];
      const completedStatuses = statusHistory.map((h: any) => h.status);

      if (completedStatuses.includes('PAID')) {
        steps.push({ status: 'PAID', label: 'Payment Confirmed', icon: CheckCircle2 });
      }
      if (completedStatuses.includes('OTP_VERIFIED')) {
        steps.push({ status: 'OTP_VERIFIED', label: 'Verified', icon: CheckCircle2 });
      }
      if (completedStatuses.includes('PREPARING')) {
        steps.push({ status: 'PREPARING', label: 'Preparing', icon: Loader2 });
      }
      if (completedStatuses.includes('READY_FOR_PICKUP')) {
        steps.push({ status: 'READY_FOR_PICKUP', label: 'Ready', icon: Package });
      }

      // Add cancelled as the final step
      steps.push({ status: 'CANCELLED', label: 'Cancelled', icon: XCircle });
      return steps;
    }

    // Normal journey for successful orders
    return [
      { status: 'PENDING', label: 'Order Placed', icon: Receipt },
      { status: 'PAID', label: 'Payment Confirmed', icon: CheckCircle2 },
      { status: 'OTP_VERIFIED', label: 'Verified', icon: CheckCircle2 },
      { status: 'PREPARING', label: 'Preparing', icon: Loader2 },
      { status: 'READY_FOR_PICKUP', label: 'Ready', icon: Package },
      { status: 'COMPLETED', label: 'Completed', icon: CheckCircle2 },
    ];
  };

  const orderSteps = getOrderSteps(order?.orderStatus || 'PENDING');

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order? This action cannot be undone.")) {
      return;
    }

    setIsCancelling(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/order/${oid}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("Token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel order");
      }

      toast.success("Order Cancelled", "Your order has been cancelled successfully");

      // Refresh order data
      const freshData = await fetchOrderData();
      if (freshData) {
        setOrder(freshData);
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Failed to Cancel", "Could not cancel the order. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!oid || typeof oid !== 'string') {
      toast.error("Error", "Invalid order ID");
      return;
    }

    setIsRetryingPayment(true);
    try {
      // Create new PhonePe payment for the existing order
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/phonepe/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("Token")}`,
          },
          body: JSON.stringify({
            orderId: oid,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to initiate payment");
      }

      const data = await response.json();
      const checkoutUrl = data.data?.checkoutUrl || data.checkoutUrl;

      if (!checkoutUrl) {
        throw new Error("No checkout URL received");
      }

      // IMPORTANT: Update sessionStorage to allow redirect page to verify payment
      sessionStorage.setItem('pendingOrderId', oid);
      sessionStorage.setItem('pendingMachineId', order?.machineId || '');
      sessionStorage.setItem('paymentInitiatedAt', Date.now().toString());

      toast.info("Redirecting to Payment", "Please complete the payment");

      // Redirect to PhonePe
      setTimeout(() => {
        window.location.href = checkoutUrl;
      }, 500);
    } catch (error) {
      console.error("Error retrying payment:", error);
      toast.error("Payment Failed", "Could not initiate payment. Please try again.");
      setIsRetryingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Order Details - GolBot</title>
        </Head>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="w-full flex justify-center">
            <div className="w-full md:w-5/6 lg:max-w-5xl min-h-screen">
              <div className="pt-[72px] px-4 py-24">
                <div className="flex flex-col items-center gap-6">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                  <p className="font-semibold text-lg">Loading order details...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Head>
          <title>Order Not Found - GolBot</title>
        </Head>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="w-full flex justify-center">
            <div className="w-full md:w-5/6 lg:max-w-5xl min-h-screen">
              <div className="pt-[72px] px-4 py-24">
                <Card className="shadow-lg">
                  <CardContent className="p-12 text-center">
                    <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
                    <p className="text-muted-foreground mb-6">The order you&apos;re looking for doesn&apos;t exist</p>
                    <Button onClick={() => router.push("/myOrders")}>
                      Back to Orders
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const status = statusConfig[order.orderStatus as keyof typeof statusConfig] || statusConfig.PENDING;
  const StatusIcon = status.icon;
  const qrContent = validateAndGenerateQR(order);
  const canShowQR = ['PAID', 'OTP_VERIFIED', 'PREPARING', 'READY_FOR_PICKUP'].includes(order.orderStatus);

  return (
    <>
      <Head>
        <title>Order #{order.orderCounter} - GolBot</title>
      </Head>

      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="w-full flex justify-center">
          <div className="w-full md:w-5/6 lg:max-w-5xl min-h-screen pb-8">
            <div className="pt-[72px]">
              {/* Back Button */}
              <div className="bg-background px-4 pt-4 pb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/myOrders")}
                  className="-ml-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Orders
                </Button>
              </div>

              {/* Main Grid Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start px-4">
                
                {/* Left Column: Status & Progress */}
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className={`bg-gradient-to-br ${status.gradient} text-white px-6 py-8 shadow-lg rounded-2xl`}>
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40 shadow-xl">
                        <StatusIcon
                          className={`h-9 w-9 text-white ${order.orderStatus === "PREPARING" ? "animate-spin" : ""}`}
                          strokeWidth={2.5}
                        />
                      </div>
                      <div className="text-center space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight">{status.label}</h1>
                        <p className="text-white/90 text-sm">{status.description}</p>
                      </div>
                      {order.orderCounter && order.orderCounter > 0 && (
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/40 px-4 py-1.5">
                          Order #{order.orderCounter}
                        </Badge>
                      )}
                      <div className="flex items-center gap-2 text-xs text-white/80 mt-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDate(order.createdAt)} • {formatTime(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Progress Timeline */}
                  <Card className="shadow-md">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-6">Order Journey</h3>
                      <div className="space-y-6">
                        {orderSteps.map((step, index) => {
                          const isLast = index === orderSteps.length - 1;
                          const isFailed = step.status === 'PAYMENT_FAILED';
                          const isCancelled = step.status === 'CANCELLED';

                          let isCompleted = false;
                          let isCurrent = false;

                          if (isCancelled || isFailed) {
                            isCompleted = true;
                            isCurrent = true;
                          } else if (order.orderStatus === 'CANCELLED' || order.orderStatus === 'PAYMENT_FAILED') {
                            isCompleted = true;
                            isCurrent = false;
                          } else {
                            const currentStepIndex = orderSteps.findIndex(s => s.status === order.orderStatus);
                            isCompleted = index <= currentStepIndex;
                            isCurrent = index === currentStepIndex;
                          }

                          const StepIcon = step.icon;

                          return (
                            <div key={step.status} className="relative">
                              <div className="flex items-start gap-4">
                                <div className={`
                                  flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center
                                  ${isFailed || isCancelled
                                    ? 'bg-destructive text-white'
                                    : isCompleted
                                    ? 'bg-primary text-white'
                                    : 'bg-muted text-muted-foreground'}
                                  ${isCurrent && !isFailed && !isCancelled ? 'ring-4 ring-primary/20' : ''}
                                  ${isCurrent && (isFailed || isCancelled) ? 'ring-4 ring-destructive/20' : ''}
                                `}>
                                  <StepIcon
                                    className={`h-5 w-5 ${step.status === 'PREPARING' && isCurrent ? 'animate-spin' : ''}`}
                                    strokeWidth={2.5}
                                  />
                                </div>

                                <div className="flex-1 pt-1">
                                  <p className={`font-semibold ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {step.label}
                                  </p>
                                  {(isFailed || isCancelled) && (
                                    <p className="text-sm text-destructive font-medium mt-0.5">{isCancelled ? 'Cancelled' : 'Failed'}</p>
                                  )}
                                  {isCurrent && !isFailed && !isCancelled && order.orderStatus !== 'COMPLETED' && (
                                    <p className="text-sm text-primary font-medium mt-0.5">In Progress</p>
                                  )}
                                  {(isCompleted && !isCurrent && !isFailed && !isCancelled) || (isCurrent && order.orderStatus === 'COMPLETED') ? (
                                    <p className="text-sm text-muted-foreground mt-0.5">Completed</p>
                                  ) : null}
                                </div>

                                {isCompleted && !isFailed && !isCancelled && (
                                  <div className="flex-shrink-0">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                  </div>
                                )}
                              </div>
                              {!isLast && (
                                <div
                                  className={`absolute left-5 top-10 w-0.5 h-6 ${isFailed || isCancelled ? 'bg-destructive' : isCompleted ? 'bg-primary' : 'bg-muted'}`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* QR Code Section - Top priority when ready */}
                  {canShowQR && qrContent && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <QrCodeIcon className="h-5 w-5 text-primary" />
                        <h2 className="font-bold text-lg">Scan to Collect</h2>
                      </div>
                      <Card className="shadow-lg overflow-hidden">
                        <div className="p-8 flex flex-col items-center bg-gradient-to-br from-primary/5 to-orange-50/30">
                          <div className="p-6 bg-white rounded-2xl shadow-xl ring-4 ring-primary/10">
                            <QRCode value={JSON.stringify(qrContent)} size={180} />
                          </div>
                          <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
                            <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse" />
                            <span className="text-sm font-semibold text-green-700">Ready to scan</span>
                          </div>
                        </div>
                        <div className="p-6 bg-muted/30 border-t text-center">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Manual Collection Code</p>
                          <div className="text-4xl font-bold tracking-[0.2em] text-primary">{order.orderOtp}</div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* Action Cards */}
                  {order.orderStatus === 'PENDING' && (
                    <Card className="shadow-md bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200/50">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                            <Clock className="h-6 w-6 text-yellow-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">Payment Pending</h3>
                            <p className="text-sm text-muted-foreground mb-4">Complete your payment to proceed with the order.</p>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button size="sm" variant="default" onClick={handleRetryPayment} disabled={isRetryingPayment} className="bg-green-600 hover:bg-green-700">
                                {isRetryingPayment ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                                Complete Payment
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelOrder} disabled={isCancelling} className="border-red-300 text-red-700 hover:bg-red-50">
                                {isCancelling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                                Cancel Order
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Column: Details & Items */}
                <div className="space-y-6">
                  {/* Preparation View Link */}
                  {['OTP_VERIFIED', 'PREPARING', 'READY_FOR_PICKUP'].includes(order.orderStatus) && (
                    <Card className="shadow-md border-orange-200/50 bg-orange-50/50">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <Loader2 className={`h-5 w-5 text-orange-600 ${order.orderStatus === 'PREPARING' ? 'animate-spin' : ''}`} />
                            </div>
                            <h3 className="font-semibold text-sm">Live Preparation View</h3>
                          </div>
                          <Button size="sm" onClick={() => router.push(`/${order.machineId}/preparingOrder`)}>View</Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Machine Location */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h2 className="font-bold text-lg">Pickup Location</h2>
                    </div>
                    <Card className="shadow-md">
                      <CardContent className="p-5">
                        <p className="font-semibold">{order.machineId}</p>
                        {order.machineLocation && <p className="text-sm text-muted-foreground mt-1">{order.machineLocation}</p>}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <h2 className="font-bold text-lg">Items Ordered</h2>
                    </div>
                    <Card className="shadow-md">
                      <CardContent className="p-5 space-y-4">
                        {order.items?.map((item: any, index: number) => (
                          <div key={index}>
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-sm">{item.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">₹{item.price} × {item.quantity}</p>
                              </div>
                              <p className="font-bold">₹{(item.price * item.quantity).toFixed(0)}</p>
                            </div>
                            {index < order.items.length - 1 && <Separator className="mt-4" />}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Bill Summary */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-primary" />
                      <h2 className="font-bold text-lg">Bill Details</h2>
                    </div>
                    <Card className="shadow-md overflow-hidden">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Item Total</span>
                          <span>₹{order.amount?.price?.toFixed(0) || "0"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Taxes & Charges</span>
                          <span>₹{order.amount?.gst?.toFixed(0) || "0"}</span>
                        </div>
                        <div className="bg-primary/5 -mx-5 -mb-5 px-5 py-4 flex justify-between items-center mt-2 border-t border-primary/10">
                          <span className="font-bold">Total Paid</span>
                          <span className="font-bold text-xl text-primary">₹{order.amount?.total?.toFixed(0) || "0"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
