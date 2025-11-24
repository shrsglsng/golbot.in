import { useRouter } from "next/router";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { AlertCircle, Clock, Package, ArrowRight, MapPin, XCircle, CreditCard, Loader2 } from "lucide-react";
import { OrderModel } from "../models/orderModel";
import { useToast } from "@/hooks/use-toast";

interface ActiveOrderBannerProps {
  activeOrder: OrderModel;
  onCheckout?: () => void;
  showCheckoutButton?: boolean;
}

export default function ActiveOrderBanner({
  activeOrder,
  onCheckout,
  showCheckoutButton = false,
}: ActiveOrderBannerProps) {
  const router = useRouter();
  const toast = useToast();
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRetryingPayment, setIsRetryingPayment] = useState(false);

  // Type assertion since OrderModel type is outdated - runtime object has different properties
  const order = activeOrder as any;
  const orderStatus = order.orderStatus || activeOrder.ostatus;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "PAID":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "PREPARING":
      case "OTP_VERIFIED":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "READY_FOR_PICKUP":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Payment Pending";
      case "PAID":
        return "Paid - Ready for OTP";
      case "OTP_VERIFIED":
        return "OTP Verified";
      case "PREPARING":
        return "Preparing Your Order";
      case "READY_FOR_PICKUP":
        return "Ready for Pickup";
      default:
        return status;
    }
  };

  const getActionText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "View Order Details";
      case "PAID":
        return "View OTP & QR Code";
      case "OTP_VERIFIED":
        return "View Order Status";
      case "PREPARING":
        return "View Preparation Status";
      case "READY_FOR_PICKUP":
        return "View QR Code";
      default:
        return "View Order";
    }
  };

  const handleViewOrder = () => {
    const orderId = activeOrder.oid || order.orderId;
    router.push(`/orders/${orderId}`);
  };

  const formatAmount = (amount: any) => {
    if (typeof amount === "number") return amount;
    return amount?.total || 0;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    setIsCancelling(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/order/${activeOrder.oid || order.orderId}/cancel`,
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

      // Refresh page after short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Failed to Cancel", "Could not cancel the order. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRetryPayment = async () => {
    setIsRetryingPayment(true);
    try {
      const orderId = activeOrder.oid || order.orderId;

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
            orderId: orderId,
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
      sessionStorage.setItem('pendingOrderId', orderId.toString());
      sessionStorage.setItem('pendingMachineId', order.machineId || '');
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

  return (
    <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-base md:text-lg text-gray-900 flex items-center gap-2 flex-wrap">
                  You Have an Active Order
                  <Badge
                    variant="outline"
                    className={`${getStatusColor(orderStatus)} text-xs font-medium`}
                  >
                    {getStatusText(orderStatus)}
                  </Badge>
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Complete your active order before placing a new one
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-gray-700">
                  Order #{order.orderCounter || "N/A"}
                </span>
              </div>

              {order.machineId && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-700 truncate">
                    {order.machineName || order.machineId}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-gray-700">
                  {formatDate(order.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="text-gray-700">
                  ₹{formatAmount(order.amount)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {orderStatus === "PENDING" && (
                  <>
                    <Button
                      onClick={handleRetryPayment}
                      variant="default"
                      size="sm"
                      disabled={isRetryingPayment}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {isRetryingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Complete Payment
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleViewOrder}
                      variant="outline"
                      size="sm"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      {getActionText(orderStatus)}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>

                    <Button
                      onClick={handleCancelOrder}
                      variant="outline"
                      size="sm"
                      disabled={isCancelling}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      {isCancelling ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel Order
                        </>
                      )}
                    </Button>
                  </>
                )}

                {orderStatus !== "PENDING" && (
                  <Button
                    onClick={handleViewOrder}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {getActionText(orderStatus)}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>

              <p className="text-xs text-gray-500">
                {orderStatus === "PENDING"
                  ? "Complete your payment to proceed with the order"
                  : orderStatus === "OTP_VERIFIED"
                  ? "OTP verified successfully. Machine will start preparing your order shortly."
                  : "You can still browse and add items to your cart"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
