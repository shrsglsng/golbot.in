import Head from "next/head"
import Image from "next/image"
import Navbar from "../../shared/navbar"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { useSelector } from "react-redux"
import { selectOrder } from "../../redux/orderSlice"
import { getIsOrderPreparing, getLatestOrder, getIsOrderCancelled } from "../../services/order"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, ChefHat, Package, Clock, Receipt, History } from "lucide-react"
import MachineBanner from "@/components/MachineBanner"
import { getMachineById, MachineInfo } from "../../services/machine"

function PreparingOrder() {
  const router = useRouter()
  const { mid } = router.query
  const [isLoading, setIsLoading] = useState(true)
  const [orderInfo, setOrderInfo] = useState<any>(null)
  const [machineInfo, setMachineInfo] = useState<MachineInfo | null>(null)
  const order = useSelector(selectOrder)

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

  useEffect(() => {
    if (!mid) return

    let isMounted = true
    let intervalId: NodeJS.Timeout | null = null

    const checkOrderStatus = async () => {
      try {
        if (!isMounted) return
        
        // Get latest order info
        const latestOrder = await getLatestOrder()
        if (latestOrder) {
          setOrderInfo(latestOrder)
        }
        
        setIsLoading(false) // Set loading to false after first check
        
        // Check if order was cancelled
        const isCancelled = await getIsOrderCancelled()
        if (!isMounted) return
        
        if (isCancelled) {
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
          if (isMounted) {
            // Order was cancelled, redirect to cancelled page
            router.replace(`/${router.query.mid}/cancelled`)
          }
          return
        }
        
        // Check if order is still preparing
        const isStillPreparing = await getIsOrderPreparing()
        if (!isMounted) return
        
        if (!isStillPreparing) {
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
          if (isMounted) {
            // Order is complete, redirect to receipt page
            router.replace(`/${router.query.mid}/receipt`)
          }
        }
      } catch (error) {
        console.error('Error checking order status:', error)
        setIsLoading(false)
      }
    }

    // Initial check
    checkOrderStatus()

    // Set up interval for subsequent checks
    intervalId = setInterval(checkOrderStatus, 5000)

    // Cleanup function
    return () => {
      isMounted = false
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [mid, router])

  if (isLoading) {
    return (
      <>
        <Head><title>Checking Order - GolBot</title></Head>
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
                        <p className="font-semibold text-lg">Checking order status...</p>
                        <p className="text-sm text-muted-foreground">Please wait a moment</p>
                      </div>
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

  const status = orderInfo?.orderStatus;

  const getStatusConfig = () => {
    if (status === 'OTP_VERIFIED') {
      return {
        icon: CheckCircle,
        color: 'text-blue-700',
        bg: 'bg-blue-100',
        gradient: 'from-blue-500 via-blue-600 to-indigo-600',
        title: 'Order Verified!',
        description: 'Machine is starting preparation...',
        statusText: 'Starting Preparation',
        pulse: true
      };
    } else if (status === 'PREPARING') {
      return {
        icon: Loader2,
        color: 'text-orange-700',
        bg: 'bg-orange-100',
        gradient: 'from-orange-500 via-orange-600 to-amber-600',
        title: 'Preparing Your Order',
        description: 'Your food is being freshly prepared',
        statusText: 'In Progress',
        pulse: true,
        animate: true
      };
    } else if (status === 'READY_FOR_PICKUP') {
      return {
        icon: Package,
        color: 'text-green-700',
        bg: 'bg-green-100',
        gradient: 'from-green-500 via-green-600 to-emerald-600',
        title: 'Order Ready!',
        description: 'Your food is ready for pickup',
        statusText: 'Ready for Pickup',
        pulse: false
      };
    } else {
      return {
        icon: Loader2,
        color: 'text-gray-700',
        bg: 'bg-gray-100',
        gradient: 'from-gray-500 via-gray-600 to-slate-600',
        title: 'Processing Your Order',
        description: 'Please wait while we process your order',
        statusText: 'Processing',
        pulse: true,
        animate: true
      };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <>
      <Head>
        <title>Preparing Order - GolBot</title>
        <meta name="description" content="Your order is being prepared" />
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
              {/* Status Banner */}
              <div className={`bg-gradient-to-br ${config.gradient} text-white px-6 py-8 shadow-lg`}>
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40 shadow-xl">
                    <StatusIcon
                      className={`h-9 w-9 text-white ${config.animate ? 'animate-spin' : ''}`}
                      strokeWidth={2.5}
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">{config.title}</h1>
                    <p className="text-white/90 text-sm">{config.description}</p>
                  </div>
                  {orderInfo?.orderCounter && orderInfo.orderCounter > 0 && (
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/40 px-4 py-1.5">
                      Order #{orderInfo.orderCounter}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Animation Section */}
              <div className="px-4 py-6">
                <Card className="shadow-lg overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative h-64 w-full bg-gradient-to-br from-primary/5 to-orange-50/30 dark:from-primary/10 dark:to-orange-950/20 flex items-center justify-center">
                      <Image
                        src="/cooking.gif"
                        alt="Cooking animation"
                        width={300}
                        height={300}
                        className="rounded-lg object-contain"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress Card */}
              <div className="px-4 pb-4">
                <Card className="shadow-md">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Status Indicator */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${config.pulse ? 'bg-primary animate-pulse' : 'bg-green-500'}`} />
                          <span className="font-semibold text-sm">{config.statusText}</span>
                        </div>
                        <Badge variant={status === 'READY_FOR_PICKUP' ? 'default' : 'secondary'}>
                          Live
                        </Badge>
                      </div>

                      <Separator />

                      {/* Time Estimate */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm mb-1">Preparation Time</p>
                          <p className="text-sm text-muted-foreground">
                            {status === 'READY_FOR_PICKUP' ? 'Completed' : '3-5 minutes approximately'}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      {/* Order Info */}
                      {orderInfo && (
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Receipt className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm mb-2">Order Details</p>
                            <div className="space-y-1.5 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Order ID</span>
                                <span className="font-mono text-xs">{orderInfo.oid || orderInfo.id}</span>
                              </div>
                              {orderInfo.orderCounter && orderInfo.orderCounter > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Order Number</span>
                                  <span className="font-semibold">#{orderInfo.orderCounter}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Info Card */}
              <div className="px-4 pb-4">
                <Card className="shadow-md bg-primary/5 border-primary/20">
                  <CardContent className="p-5">
                    <div className="text-center space-y-2">
                      <p className="font-semibold text-sm">Please Stay Near the Machine</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {status === 'READY_FOR_PICKUP'
                          ? 'Your order is ready! Please collect it from the machine now.'
                          : 'Your order will be ready shortly. You\'ll be automatically redirected when it\'s complete.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="px-4 pb-6 space-y-3">
                {orderInfo?.oid && (
                  <Button
                    size="lg"
                    onClick={() => {
                      // Store order in sessionStorage before navigating
                      sessionStorage.setItem(`order_${orderInfo.oid}`, JSON.stringify(orderInfo));
                      router.push(`/orders/${orderInfo.oid}`)
                    }}
                    className="w-full h-12"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    View Order Details
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push(`/myOrders`)}
                  className="w-full h-12"
                >
                  <History className="h-4 w-4 mr-2" />
                  View Order History
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PreparingOrder
