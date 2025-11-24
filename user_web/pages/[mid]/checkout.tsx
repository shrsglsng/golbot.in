import Head from "next/head"
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { selectCart, updateCart } from "../../redux/cartSlice";
import { placeOrder, getActiveOrder } from "../../services/order";
import { updateOrder } from "../../redux/orderSlice";
import { GetServerSideProps } from "next/types";
import Navbar from "../../shared/navbar";
import { ItemModel as BaseItemModel } from "../../models/itemModel";
import { handleAuthenticationError, showUserFriendlyError } from "../../utils/authErrorHandler";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { CartItemCard } from "@/components/features/CartItemCard";
import { ArrowLeft, ShoppingCart, Loader2, Package, Receipt, MapPin, Clock } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import MachineBanner from "@/components/MachineBanner";
import ActiveOrderBanner from "@/components/ActiveOrderBanner";
import { InsufficientStockDialog } from "@/components/InsufficientStockDialog";
import { getMachineById, MachineInfo } from "../../services/machine";
import { saveMachineId, isAuthenticated } from "../../utils/machineStorage";
import { OrderModel } from "../../models/orderModel";

type ExtendedItemModel = BaseItemModel & { quantity: number };

function CheckoutPage() {
  const router = useRouter();
  const items = useSelector(selectCart);
  const dispatch = useDispatch();
  const { mid } = router.query;
  const toast = useToast();

  const [isConBtnLoading, setIsConBtnLoading] = useState(false);
  const [amount, setAmount] = useState({ price: 0, gst: 0, total: 0 });
  const [machineInfo, setMachineInfo] = useState<MachineInfo | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeOrder, setActiveOrder] = useState<OrderModel | null>(null);
  const [checkingActiveOrder, setCheckingActiveOrder] = useState(true);
  const [stockError, setStockError] = useState<{
    needed: number;
    available: number;
    itemName?: string;
  } | null>(null);

  // Check authentication and save MID
  useEffect(() => {
    if (mid && typeof mid === "string") {
      // Save the MID to localStorage
      saveMachineId(mid);

      // Check if user is authenticated
      if (!isAuthenticated()) {
        console.log('User not authenticated, redirecting to login');
        router.replace(`/auth/login?next=${mid}`);
        return;
      }

      setCheckingAuth(false);
    }
  }, [mid, router]);

  // Check for active orders
  useEffect(() => {
    if (!checkingAuth && isAuthenticated()) {
      getActiveOrder()
        .then((result) => {
          if (result && result.hasActiveOrder && result.activeOrder) {
            setActiveOrder(result.activeOrder);
          }
        })
        .catch((error) => {
          console.error("Error checking active order:", error);
        })
        .finally(() => {
          setCheckingActiveOrder(false);
        });
    } else {
      setCheckingActiveOrder(false);
    }
  }, [checkingAuth]);

  // Fetch machine info
  useEffect(() => {
    if (mid && typeof mid === "string" && !checkingAuth) {
      getMachineById(mid).then((result) => {
        if (result.success && result.machine) {
          setMachineInfo(result.machine);
        }
      });
    }
  }, [mid, checkingAuth]);

  const handleConfirmBtnClick = async () => {
    // Block if there's an active order
    if (activeOrder) {
      toast.error(
        "Active Order Exists",
        "Please complete or cancel your active order before placing a new one."
      );
      return;
    }

    setIsConBtnLoading(true);

    try {
      const itemsToOrder = items
        .filter((item) => item.quantity > 0)
        .map((item) => ({
          id: item.id,
          quantity: item.quantity
        }));

      if (itemsToOrder.length === 0) {
        throw new Error("No valid items to order");
      }

      console.log("Prepared items for order:", itemsToOrder);

      // Step 1: Create DB Order
      const result = await placeOrder(itemsToOrder, mid?.toString() ?? "");
      const dbOrder = result?.order;

      if (!dbOrder?.oid) throw new Error("Failed to create order");

      dispatch(updateOrder({ order: dbOrder }));

      // Step 2: Create PhonePe Order
      const phonepeRes = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/phonepe/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("Token")}`,
          },
          body: JSON.stringify({ orderId: dbOrder.oid }),
        }
      );

      const phonepeData = await phonepeRes.json();
      console.log("PhonePe order response:", phonepeData);

      if (phonepeRes.status !== 201 || !phonepeData?.data?.phonepeOrder?.orderId) {
        console.error("PhonePe order creation failed:", phonepeData);
        throw new Error("Failed to create PhonePe order");
      }

      const phonepeOrder = phonepeData.data.phonepeOrder;
      const checkoutUrl = phonepeData.data.checkoutUrl || phonepeOrder?.checkoutUrl;
      const payPageUrl = phonepeOrder?.payPageUrl;
      const orderId = phonepeOrder?.orderId;
      
      let finalCheckoutUrl = checkoutUrl || payPageUrl;

      console.log("PhonePe order details:", {
        orderId,
        checkoutUrl,
        payPageUrl,
        finalCheckoutUrl,
        debug: phonepeData.data.debug,
        fullResponse: phonepeData.data
      });

      if (!finalCheckoutUrl) {
        // If no immediate URL, check if polling is available
        if (phonepeData.data.fallbackAvailable && phonepeData.data.pollEndpoint) {
          console.log("🔄 No immediate checkout URL, attempting to poll for it...");
          
          // Show user-friendly message
          alert("Please wait while we prepare your payment... This may take a few seconds.");
          
          // Try polling for the URL for up to 30 seconds
          const maxAttempts = 10;
          const pollInterval = 3000; // 3 seconds
          
          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`📡 Polling attempt ${attempt}/${maxAttempts} for payment URL...`);
            
            try {
              await new Promise(resolve => setTimeout(resolve, pollInterval));
              
              const pollRes = await fetch(
                `${process.env.NEXT_PUBLIC_SERVER_URL}/phonepe/payment-url/${orderId}`,
                {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("Token")}`,
                  },
                }
              );
              
              const pollData = await pollRes.json();
              console.log(`📡 Poll attempt ${attempt} response:`, pollData);
              
              if (pollRes.status === 200 && pollData.data?.found && pollData.data?.paymentUrl) {
                console.log("✅ Payment URL found via polling!");
                finalCheckoutUrl = pollData.data.paymentUrl;
                break;
              }
              
              if (attempt === maxAttempts) {
                throw new Error("Payment URL not available after polling. Please try again or contact support.");
              }
            } catch (pollError) {
              console.error(`❌ Poll attempt ${attempt} failed:`, pollError);
              if (attempt === maxAttempts) {
                const errorMessage = pollError instanceof Error ? pollError.message : String(pollError);
                throw new Error(`Failed to get payment URL after ${maxAttempts} attempts. Error: ${errorMessage}`);
              }
            }
          }
        } else {
          console.error("PhonePe checkout URL missing:", {
            phonepeData,
            expectedStructure: "data.phonepeOrder.checkoutUrl or data.phonepeOrder.payPageUrl"
          });
          throw new Error(`PhonePe checkout URL not received. Response: ${JSON.stringify(phonepeData.data.debug || {})}`);
        }
      }
      
      if (!finalCheckoutUrl) {
        throw new Error("Unable to obtain PhonePe checkout URL");
      }

      // Step 3: Redirect to PhonePe Checkout
      console.log("🟦 Redirecting to PhonePe checkout:", finalCheckoutUrl);

      // Store order details for return handling
      sessionStorage.setItem('pendingOrderId', orderId);
      sessionStorage.setItem('pendingMachineId', mid?.toString() || '');
      // Store payment initiation timestamp for expiry validation (30 min expiry)
      sessionStorage.setItem('paymentInitiatedAt', Date.now().toString());

      // Detect if user is on mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // Show user-friendly message
      const redirectMessage = isMobile
        ? "Opening PhonePe app..."
        : "Redirecting to PhonePe payment...";

      toast.info(redirectMessage, "Please complete the payment");

      if (isMobile) {
        // On mobile, try to open PhonePe app
        console.log("📱 Mobile detected - Attempting to open PhonePe app");

        // Try to open the app using location.replace for better deep linking
        setTimeout(() => {
          try {
            // Use replace to avoid adding to browser history
            window.location.replace(finalCheckoutUrl);
          } catch (error) {
            console.error("Failed to open PhonePe app:", error);
            // Fallback to regular redirect
            window.location.href = finalCheckoutUrl;
          }
        }, 300);
      } else {
        // On desktop, use normal redirect
        console.log("💻 Desktop detected - Redirecting to PhonePe web");
        setTimeout(() => {
          window.location.href = finalCheckoutUrl;
        }, 500);
      }

      /* RAZORPAY IMPLEMENTATION (COMMENTED OUT - KEPT FOR FALLBACK)
      // Step 2: Create Razorpay Order
      const razorRes = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/payment/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("Token")}`,
          },
          body: JSON.stringify({ orderId: dbOrder.oid }),
        }
      );

      const razorData = await razorRes.json();
      console.log("Razorpay order response:", razorData);

      if (razorRes.status !== 201 || !razorData?.data?.razorpayOrder?.orderId) {
        throw new Error("Failed to create Razorpay order");
      }

      const { orderId, amount, currency } = razorData.data.razorpayOrder;

      // Step 3: Open Razorpay Checkout
      const razorpay = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: "AiBotInk Pvt. Ltd.",
        description: `Food Order - ${itemsToOrder.length} item${itemsToOrder.length > 1 ? 's' : ''}`,
        order_id: orderId,
        handler: async function (response: any) {
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;

          try {
            const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/payment/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("Token")}`,
              },
              body: JSON.stringify({
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.status === 200 && verifyData.success) {
              router.push(`/${mid}/payment/${razorpay_order_id}/success`);
            } else {
              alert("Payment verification failed");
              router.push(`/${mid}/payment/${razorpay_order_id}/failed`);
            }
          } catch (err) {
            console.error("❌ Verification error:", err);
            router.push(`/${mid}/payment/${razorpay_order_id}/failed`);
          }
        },
        modal: {
          ondismiss: function () {
            router.push(`/${mid}/payment/${orderId}/failed`);
          },
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#3399cc",
        },
      });

      razorpay.open();
      */

    } catch (err: any) {
      console.error("❌ Payment initiation failed:", err);

      // Handle authentication errors
      if (handleAuthenticationError(err, router, mid?.toString())) {
        return;
      }

      // Handle insufficient stock errors with dialog
      if (err.message?.includes("Insufficient puris")) {
        // Try to extract stock info from error
        const errorData = err.response?.data?.error?.data;
        const purisNeeded = errorData?.purisNeeded;
        const purisAvailable = errorData?.purisAvailable;

        // If we have the data, show the dialog. Otherwise extract from message.
        if (purisNeeded !== undefined && purisAvailable !== undefined) {
          setStockError({
            needed: purisNeeded,
            available: purisAvailable,
            itemName: "puris"
          });
        } else {
          // Fallback: try to parse from error message
          const match = err.message.match(/needs (\d+) puris.*only (\d+) are available/);
          if (match) {
            setStockError({
              needed: parseInt(match[1]),
              available: parseInt(match[2]),
              itemName: "puris"
            });
          } else {
            // If parsing fails, show a generic insufficient stock error
            toast.error("Insufficient Stock", err.message);
          }
        }
        return;
      }

      // Show specific error message for machine issues
      if (err.message?.includes("offline") || err.message?.includes("inactive")) {
        toast.error("Machine Unavailable", err.message);
        // Optionally redirect back to machine selection after a delay
        setTimeout(() => {
          router.push("/order");
        }, 3000);
        return;
      }

      // Show user-friendly error message
      showUserFriendlyError(err, "Something went wrong while creating your order. Please try again.");
    } finally {
      setIsConBtnLoading(false);
    }
  };


  useEffect(() => {
    let tmpPrice = 0;
    let tmpGst = 0;

    items.forEach((ele) => {
      const price = ele.price ?? 0;
      const gst = ele.gst ?? 0;
      tmpPrice += price * ele.quantity;
      tmpGst += gst * ele.quantity;
    });

    const total = tmpPrice + tmpGst;
    setAmount({ price: tmpPrice, gst: tmpGst, total });

    if (total === 0) router.push(`/${mid}`);
  }, [items, mid, router]);

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Checkout - GolBot</title>
        <meta name="description" content="Review your cart and complete your order" />
      </Head>

      <div className="min-h-screen bg-background">
        <Navbar />
        {machineInfo && (
          <MachineBanner
            machineId={machineInfo.id}
            location={machineInfo.location}
            variant="compact"
          />
        )}

        <div className="w-full flex justify-center">
          <div className="w-full md:w-1/2 lg:w-1/4 min-h-screen pb-32">
            <div className="pt-[72px]">
              {/* Active Order Banner */}
              {activeOrder && (
                <div className="px-4 pt-4 pb-2">
                  <ActiveOrderBanner activeOrder={activeOrder} />
                </div>
              )}
              {/* Header */}
              <div className="bg-background sticky top-[72px] z-10 border-b shadow-sm">
                <div className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/${mid}`)}
                      className="h-9 w-9"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                      <h1 className="text-xl font-bold">Review Order</h1>
                      <div className="flex items-center gap-2 mt-0.5">
                        {machineInfo && (
                          <>
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {machineInfo.location || machineInfo.id}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cart Items */}
              {amount.total === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h2 className="text-lg font-semibold mb-2">Your cart is empty</h2>
                  <p className="text-sm text-muted-foreground text-center mb-6">
                    Add items from the menu to get started
                  </p>
                  <Button onClick={() => router.push(`/${mid}`)} size="lg">
                    Browse Menu
                  </Button>
                </div>
              ) : (
                <>
                  {/* Cart Items Section */}
                  <div className="px-4 pt-4 pb-2">
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="h-5 w-5 text-primary" />
                      <h2 className="font-bold text-lg">Your Items</h2>
                      <Badge variant="secondary" className="ml-auto">
                        {items.filter(i => i.quantity > 0).length} items
                      </Badge>
                    </div>
                  </div>

                  <div className="px-4 pb-4">
                    <Card className="shadow-md">
                      <CardContent className="p-4 pt-3">
                        {items.map((item, i) =>
                          item.quantity > 0 && (
                            <CartItemCard
                              key={item.id ?? i}
                              item={item}
                              index={i}
                              onQuantityChange={(action) => {
                                if (action === "+" && item.quantity < 10) {
                                  dispatch(updateCart({ item: { ...item, quantity: item.quantity + 1 }, index: i }))
                                } else if (action === "-" && item.quantity > 1) {
                                  dispatch(updateCart({ item: { ...item, quantity: item.quantity - 1 }, index: i }))
                                }
                              }}
                              onRemove={() => dispatch(updateCart({ item: { ...item, quantity: 0 }, index: i }))}
                            />
                          )
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Delivery Info Section */}
                  <div className="px-4 pb-4">
                    <Card className="shadow-md bg-gradient-to-br from-primary/5 to-orange-50/50 dark:from-primary/10 dark:to-orange-950/20 border-primary/20">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Clock className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1 text-sm">Ready in 60 seconds</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Your order will be prepared fresh and ready for pickup at the vending machine
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Bill Details Section */}
                  <div className="px-4 pt-2 pb-2">
                    <div className="flex items-center gap-2 mb-4">
                      <Receipt className="h-5 w-5 text-primary" />
                      <h2 className="font-bold text-lg">Bill Details</h2>
                    </div>
                  </div>

                  <div className="px-4 pb-6">
                    <Card className="shadow-md">
                      <CardContent className="p-5 space-y-4">
                        <div className="space-y-3.5">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Item Total</span>
                            </div>
                            <span className="font-semibold">₹{amount.price.toFixed(0)}</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Taxes & Charges</span>
                            </div>
                            <span className="font-semibold">₹{amount.gst.toFixed(0)}</span>
                          </div>

                          <Separator className="my-3" />

                          <div className="flex justify-between items-center bg-primary/5 dark:bg-primary/10 -mx-5 -mb-5 px-5 py-4 rounded-b-lg">
                            <span className="font-bold text-base">TO PAY</span>
                            <span className="font-bold text-2xl text-primary">₹{amount.total.toFixed(0)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>

            {/* Fixed Payment Button */}
            {amount.total > 0 && (
              <div className="fixed bottom-0 left-0 right-0 md:left-1/2 md:right-auto md:w-1/2 lg:w-1/4 md:-translate-x-1/2 bg-gradient-to-t from-background via-background to-background/80 backdrop-blur-xl border-t shadow-2xl">
                <div className="p-4 space-y-3">
                  {/* Payment Summary */}
                  <div className="flex items-center justify-between px-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-bold">₹{amount.total.toFixed(0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {items.reduce((acc, i) => acc + i.quantity, 0)} items
                      </p>
                      <p className="text-xs font-medium text-green-600">
                        Incl. all taxes
                      </p>
                    </div>
                  </div>

                  {/* Payment Button */}
                  <Button
                    onClick={handleConfirmBtnClick}
                    loading={isConBtnLoading}
                    disabled={amount.total <= 0 || isConBtnLoading || !!activeOrder}
                    className="w-full h-14 text-base font-bold shadow-lg hover:shadow-xl transition-all"
                    size="lg"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>
                        {isConBtnLoading
                          ? "Processing Payment..."
                          : activeOrder
                          ? "Complete Active Order First"
                          : "Proceed to Pay"}
                      </span>
                      {!isConBtnLoading && !activeOrder && <span className="text-lg">→</span>}
                    </div>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Insufficient Stock Dialog */}
        <InsufficientStockDialog
          open={!!stockError}
          onOpenChange={(open) => {
            if (!open) setStockError(null);
          }}
          itemName={stockError?.itemName}
          needed={stockError?.needed || 0}
          available={stockError?.available || 0}
          onRetry={handleConfirmBtnClick}
        />
      </div>
    </>
  );
}

export default CheckoutPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (!context.req.headers.referer) {
    return {
      redirect: { permanent: false, destination: `/${context.query.mid}` },
    };
  }

  return {
    props: {},
  };
};
