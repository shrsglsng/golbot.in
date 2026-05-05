import Head from "next/head"
import { useEffect, useState } from "react"
import QRCode from "react-qr-code"
import Link from "next/link"
import { useSelector, useDispatch } from "react-redux"
import { selectOrder, updateOrder } from "../../redux/orderSlice"
import { useRouter } from "next/router"
import Navbar from "../../shared/navbar"
import { getIsOrderPreparing, getOrderOtp } from "../../services/order"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/Container"
import { Stack } from "@/components/layout/Stack"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, QrCode as QrCodeIcon, AlertTriangle, Loader2, ShoppingCart, History, Scan, Clock, Package, Receipt } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import MachineBanner from "@/components/MachineBanner"
import { getMachineById, MachineInfo } from "../../services/machine"

function QRPage() {
  const router = useRouter()
  const order = useSelector(selectOrder)
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [machineInfo, setMachineInfo] = useState<MachineInfo | null>(null)

  const { mid } = router.query

  // Fetch machine info
  useEffect(() => {
    if (mid && typeof mid === "string") {
      getMachineById(mid).then((result) => {
        if (result.success && result.machine) {
          setMachineInfo(result.machine);
        }
      });
    }
  }, [mid]);

  // QR Content validation function
  const validateAndGenerateQR = (order: any) => {
    if (!order) {
      return null;
    }

    // Check for OTP
    const otp = order.orderOtp;

    if (!otp) {
      return null;
    }

    // Convert to string and validate length
    const otpString = String(otp);
    if (otpString.length < 4 || otpString.length > 6) {
      return null;
    }

    const qrContent = {
      otp: otpString,
      orderId: order.oid || order.id || order._id,
      timestamp: Date.now()
    };

    return qrContent;
  }

  useEffect(() => {
    if (!mid) return

    const initializeQRPage = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Get order with OTP
        const orderRes = await getOrderOtp()
        
        if (!orderRes?.orderOtp) {
          setError("No valid order found. Please place a new order.");
          setTimeout(() => {
            router.replace(`/${mid}`)
          }, 3000)
          return
        }

        dispatch(updateOrder({ order: orderRes }))
        
        // Start polling for order status
        const intervalId = setInterval(async () => {
          try {
            const isStillReady = await getIsOrderPreparing()
            if (isStillReady) {
              // Order has started preparing, redirect to preparing page
              clearInterval(intervalId)
              setPollingInterval(null)
              router.replace(`/${mid}/preparingOrder`)
            }
          } catch (error) {
            // Silently continue polling on error
          }
        }, 3000) // Check every 3 seconds

        setPollingInterval(intervalId)
        
      } catch (error: any) {
        if (error.message === 'AUTHENTICATION_REQUIRED') {
          router.replace(`/${mid}`)
        } else {
          setError("Unable to load order details. Please try again.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    initializeQRPage()

    // Cleanup function
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [mid])

  // Handle page visibility change to pause/resume polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && pollingInterval) {
        clearInterval(pollingInterval)
        setPollingInterval(null)
      } else if (!document.hidden && !pollingInterval && order?.orderOtp) {
        const intervalId = setInterval(async () => {
          try {
            const isStillReady = await getIsOrderPreparing()
            if (isStillReady) {
              clearInterval(intervalId)
              setPollingInterval(null)
              router.replace(`/${mid}/preparingOrder`)
            }
          } catch (error) {
            // Silently continue polling on error
          }
        }, 3000)
        setPollingInterval(intervalId)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pollingInterval, order?.orderOtp, mid, router])

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Loading Order - GolBot</title>
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
            <div className="w-full md:w-5/6 lg:max-w-4xl min-h-screen">
              <div className="pt-[72px] px-4 py-24">
                <Card className="shadow-lg">
                  <CardContent className="p-12">
                    <div className="flex flex-col items-center gap-6">
                      <Loader2 className="h-16 w-16 text-primary animate-spin" />
                      <div className="text-center space-y-2">
                        <p className="font-semibold text-lg">Loading your order...</p>
                        <p className="text-sm text-muted-foreground">Please wait a moment</p>
                      </div>
                      <Skeleton className="h-64 w-64 rounded-2xl" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Error - GolBot</title>
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
            <div className="w-full md:w-5/6 lg:max-w-4xl min-h-screen">
              <div className="pt-[72px] px-4 py-24">
                <Card className="shadow-lg border-destructive/20">
                  <CardContent className="p-12">
                    <div className="flex flex-col items-center gap-6">
                      <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="h-10 w-10 text-destructive" />
                      </div>
                      <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold">Order Not Found</h2>
                        <p className="text-muted-foreground">{error}</p>
                      </div>
                      <Button
                        onClick={() => router.replace(`/${mid}`)}
                        size="lg"
                        className="w-full max-w-xs"
                      >
                        Go Back to Menu
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Scan QR Code - GolBot</title>
        <meta name="description" content="Scan the QR code at the vending machine" />
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
          <div className="w-full md:w-5/6 lg:max-w-4xl min-h-screen pb-8">
            <div className="pt-[72px]">
              {/* Success Banner */}
              <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 text-white px-6 py-8 shadow-lg">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40 shadow-xl">
                    <CheckCircle className="h-9 w-9 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Payment Successful!</h1>
                    <p className="text-white/90 text-sm">
                      Your order is confirmed and ready to prepare
                    </p>
                  </div>
                  {order?.orderCounter && order.orderCounter > 0 && (
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/40 px-4 py-1.5">
                      Order #{order.orderCounter}
                    </Badge>
                  )}
                </div>
              </div>

              {/* QR Code Section */}
              <div className="px-4 py-6">
                <Card className="shadow-lg">
                  <CardContent className="p-0">
                    {(() => {
                      const qrContent = validateAndGenerateQR(order);

                      if (!qrContent) {
                        return (
                          <div className="p-8 flex flex-col items-center gap-4">
                            <AlertTriangle className="h-12 w-12 text-destructive" />
                            <div className="text-center">
                              <p className="text-destructive font-medium mb-1">QR Generation Issue</p>
                              <p className="text-sm text-muted-foreground">Please refresh the page or try again.</p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <>
                          {/* QR Code Display */}
                          <div className="p-8 flex flex-col items-center bg-gradient-to-br from-primary/5 to-orange-50/30 dark:from-primary/10 dark:to-orange-950/20">
                            <div className="p-6 bg-white rounded-2xl shadow-xl ring-4 ring-primary/10">
                              <QRCode
                                value={JSON.stringify(qrContent)}
                                size={220}
                              />
                            </div>
                            <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-950/30 rounded-full">
                              <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse" />
                              <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                                Ready to scan
                              </span>
                            </div>
                          </div>

                          <Separator />

                          {/* OTP Code */}
                          <div className="p-6 bg-muted/30">
                            <div className="text-center space-y-3">
                              <div className="flex items-center justify-center gap-2">
                                <QrCodeIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                  Or enter code manually
                                </span>
                              </div>
                              <div className="text-5xl font-bold tracking-[0.2em] text-primary">
                                {order?.orderOtp || 'N/A'}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                This code is valid for this order only
                              </p>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>

              {/* How to Use Section */}
              <div className="px-4 pb-4">
                <div className="mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h2 className="font-bold text-lg">How to collect your order</h2>
                </div>
                <Card className="shadow-md">
                  <CardContent className="p-5 space-y-4">
                    {/* Step 1 */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-md">
                        1
                      </div>
                      <div className="flex-1 pt-1">
                        <h3 className="font-semibold mb-1">Scan QR or Enter Code</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Use the scanner at the vending machine to scan the QR code above, or manually enter the 4-digit code
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Step 2 */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-md">
                        2
                      </div>
                      <div className="flex-1 pt-1">
                        <h3 className="font-semibold mb-1">Wait for Preparation</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Your order will be prepared fresh in approximately 60 seconds
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Step 3 */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-md">
                        3
                      </div>
                      <div className="flex-1 pt-1">
                        <h3 className="font-semibold mb-1">Collect & Enjoy</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Pick up your order from the collection slot and enjoy your meal!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="px-4 pb-6 space-y-3">
                {order?.oid && (
                  <Button
                    size="lg"
                    onClick={() => {
                      // Store order in sessionStorage before navigating
                      sessionStorage.setItem(`order_${order.oid}`, JSON.stringify(order));
                      router.push(`/orders/${order.oid}`)
                    }}
                    className="w-full h-14 font-semibold shadow-lg"
                  >
                    <Receipt className="h-5 w-5 mr-2" />
                    View Order Details
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push(`/${mid}`)}
                  className="w-full h-12"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Place Another Order
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push(`/myOrders`)}
                  className="w-full h-12"
                >
                  <History className="h-4 w-4 mr-2" />
                  View All Orders
                </Button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default QRPage
