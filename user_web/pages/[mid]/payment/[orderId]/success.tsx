import Head from "next/head"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Container } from "@/components/layout/Container"
import { Stack } from "@/components/layout/Stack"
import { CheckCircle, Loader2 } from "lucide-react"
import MachineBanner from "@/components/MachineBanner"
import { getMachineById, MachineInfo } from "../../../../services/machine"
import { getLatestOrder } from "../../../../services/order"
import { useDispatch } from "react-redux"
import { clearCart } from "../../../../redux/cartSlice"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { mid, orderId } = router.query
  const [countdown, setCountdown] = useState(2)
  const [machineInfo, setMachineInfo] = useState<MachineInfo | null>(null)

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
    if (!mid || !orderId) return

    let isMounted = true;

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Fetch latest order and redirect
    const redirectToOrder = async () => {
      try {
        const latestOrder = await getLatestOrder();

        if (!isMounted) return;

        if (latestOrder) {
          // Clear cart from localStorage and Redux
          if (mid && typeof mid === 'string') {
            try {
              localStorage.removeItem(`golbot_cart_${mid}`);
              dispatch(clearCart());
              console.log('Cart cleared after successful payment');
            } catch (error) {
              console.error('Error clearing cart:', error);
            }
          }

          // Store order in sessionStorage for detail page
          sessionStorage.setItem(`order_${latestOrder.oid}`, JSON.stringify(latestOrder));

          // Redirect to order detail page
          setTimeout(() => {
            if (isMounted) {
              router.replace(`/orders/${latestOrder.oid}`)
            }
          }, 2000);
        } else {
          // Fallback to myOrders if no order data
          setTimeout(() => {
            if (isMounted) {
              router.replace(`/myOrders`)
            }
          }, 2000);
        }
      } catch (error) {
        console.error('Error fetching latest order:', error);
        // Fallback to myOrders on error
        setTimeout(() => {
          if (isMounted) {
            router.replace(`/myOrders`)
          }
        }, 2000);
      }
    }

    redirectToOrder();

    return () => {
      isMounted = false;
      clearInterval(countdownInterval)
    }
  }, [mid, orderId])

  return (
    <>
      <Head>
        <title>Payment Successful - GolBot</title>
        <meta name="description" content="Your payment was successful" />
      </Head>

      <div className="min-h-screen flex flex-col">
        {machineInfo && (
          <MachineBanner
            machineId={machineInfo.id}
            location={machineInfo.location}
            variant="compact"
          />
        )}
        <div className="flex-1 flex items-center justify-center p-4">
          <Container size="sm">
          <Card className="shadow-2xl border-green-200 animate-fade-in">
            <CardContent className="p-12">
              <Stack spacing="xl" align="center">
                {/* Success Icon */}
                <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>

                {/* Success Message */}
                <Stack spacing="sm" align="center">
                  <h1 className="text-3xl md:text-4xl font-bold text-green-600 text-center">
                    Payment Successful!
                  </h1>
                  <p className="text-muted-foreground text-center">
                    Your payment has been processed successfully
                  </p>
                </Stack>

                {/* Transaction ID */}
                {orderId && (
                  <div className="w-full bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground text-center mb-1">
                      Transaction ID
                    </p>
                    <p className="font-mono text-sm font-medium text-center break-all">
                      {orderId}
                    </p>
                  </div>
                )}

                {/* Redirect Notice */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Redirecting to order details in {countdown}s...</span>
                </div>
              </Stack>
            </CardContent>
          </Card>
          </Container>
        </div>
      </div>
    </>
  )
}
