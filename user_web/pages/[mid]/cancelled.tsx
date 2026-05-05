import Head from "next/head"
import Navbar from "../../shared/navbar"
import Link from "next/link"
import { useRouter } from "next/router"
import { useSelector, useDispatch } from "react-redux"
import { selectOrder, clearOrder } from "../../redux/orderSlice"
import { selectCart, clearCart } from "../../redux/cartSlice"
import { useEffect, useState } from "react"
import { getLatestOrder } from "../../services/order"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/Container"
import { Stack } from "@/components/layout/Stack"
import { Badge } from "@/components/ui/badge"
import { XCircle, Home, AlertTriangle } from "lucide-react"

function CancelledPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const order = useSelector(selectOrder)
  const [orderInfo, setOrderInfo] = useState<any>(null)

  useEffect(() => {
    const fetchOrderInfo = async () => {
      try {
        const latestOrder = await getLatestOrder()
        if (latestOrder) {
          setOrderInfo(latestOrder)
        }
      } catch (error) {
        console.error('Error fetching order info:', error)
      }
    }

    fetchOrderInfo()
  }, [])

  // Handler for Go to Home button
  const handleGoHome = () => {
    dispatch(clearCart())
    dispatch(clearOrder({}))
    router.replace(`/${router.query.mid}`)
  }

  return (
    <>
      <Head>
        <title>Order Cancelled - GolBot</title>
        <meta name="description" content="Your order has been cancelled" />
      </Head>

      <div className="min-h-screen">
        <Navbar />

        <Container size="sm" className="py-24">
          <Stack spacing="xl" align="center">
            {/* Cancelled Header */}
            <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center animate-fade-in">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>

            <Stack spacing="sm" align="center">
              <h1 className="text-3xl font-bold text-center">Order Cancelled</h1>
              <p className="text-muted-foreground text-center max-w-md">
                Your order has been cancelled. If this was unexpected, please contact support.
              </p>
            </Stack>

            {/* Order Info Card */}
            {orderInfo && (
              <Card className="w-full shadow-xl border-destructive/20 animate-slide-in-from-bottom">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="bg-destructive/10 p-6 border-b border-destructive/20">
                    <Stack spacing="xs" align="center">
                      <h2 className="font-semibold text-lg text-destructive">Cancelled Order</h2>
                      {orderInfo?.oid && (
                        <p className="text-sm text-muted-foreground">
                          Order ID: {orderInfo.oid.toString().slice(-8)}
                        </p>
                      )}
                    </Stack>
                  </div>

                  {/* Order Details */}
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant="destructive" className="font-semibold">
                        CANCELLED
                      </Badge>
                    </div>
                    {orderInfo.amount && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Amount</span>
                        <span className="font-semibold text-lg">₹{orderInfo.amount.total}</span>
                      </div>
                    )}

                    {/* Info Box */}
                    <div className="bg-muted/50 rounded-lg p-4 flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        If your payment was processed, it will be refunded within 5-7 business days.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Button */}
            <Button onClick={handleGoHome} size="lg" className="w-full sm:w-auto">
              <Home className="h-4 w-4" />
              Go to Home
            </Button>

          </Stack>
        </Container>
      </div>
    </>
  )
}

export default CancelledPage