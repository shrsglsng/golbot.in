import Head from "next/head"
import Navbar from "../../shared/navbar"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/router"
import { useSelector, useDispatch } from "react-redux"
import { selectOrder, clearOrder } from "../../redux/orderSlice"
import { selectCart, clearCart } from "../../redux/cartSlice"
import { ItemModel } from "../../models/itemModel"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/Container"
import { Stack } from "@/components/layout/Stack"
import { CheckCircle, Home } from "lucide-react"
import { ReportIssueButton } from "@/components/ReportIssueButton"

interface ItemRowProps {
  itemName: string
  qty: number
  price: number
}

function ItemRow({ itemName, qty, price }: ItemRowProps) {
  if (qty === 0) return null

  return (
    <div className="flex justify-between items-center py-2 px-4">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Image src="/vegIcon.svg" height={16} width={16} alt="Veg" />
        </div>
        <div className="text-sm">
          <span className="font-medium">{itemName}</span>
          <span className="text-muted-foreground"> × {qty}</span>
        </div>
      </div>
      <div className="font-semibold">₹{(price * qty).toFixed(2)}</div>
    </div>
  )
}

function ReceiptPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const order = useSelector(selectOrder)
  const items = useSelector(selectCart)



  // Handler for Go to Home button
  const handleGoHome = () => {
    dispatch(clearCart())
    dispatch(clearOrder({}))
    router.replace(`/${router.query.mid}`)
  }

  if (!order) {
    return null
  }

  return (
    <>
      <Head>
        <title>Order Complete - GolBot</title>
        <meta name="description" content="Your order has been completed successfully" />
      </Head>

      <div className="min-h-screen">
        <Navbar />

        <Container size="sm" className="py-24">
          <Stack spacing="xl" align="center">
            {/* Success Header */}
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center animate-fade-in">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>

            <Stack spacing="sm" align="center">
              <h1 className="text-3xl font-bold text-center">Order Complete!</h1>
              <p className="text-muted-foreground text-center max-w-md">
                Thank you for your order. Enjoy your meal!
              </p>
            </Stack>

            {/* Order Receipt Card */}
            <Card className="w-full shadow-xl animate-slide-in-from-bottom">
              <CardContent className="p-0">
                {/* Header */}
                <div className="bg-muted/50 p-6 border-b">
                  <Stack spacing="xs" align="center">
                    <h2 className="font-semibold text-lg">Order Receipt</h2>
                    {order?.oid && (
                      <p className="text-sm text-muted-foreground">
                        Order ID: {order.oid.toString().slice(-8)}
                      </p>
                    )}
                  </Stack>
                </div>

                {/* Items List */}
                <div className="divide-y">
                  {items.map((item: ItemModel) => (
                    <ItemRow
                      key={item.id || item.name}
                      itemName={item.name}
                      //@ts-ignore
                      qty={order?.itemQty?.[item.id] || item.quantity || 0}
                      price={item.price}
                    />
                  ))}
                </div>

                {/* Divider */}
                <div className="px-6 py-4">
                  <div className="border-t border-dashed" />
                </div>

                {/* Pricing Summary */}
                <div className="px-6 pb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Item Total</span>
                    <span className="font-medium">₹{order?.amount?.price ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxes & Charges</span>
                    <span className="font-medium">₹{order?.amount?.gst ?? 0}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="bg-muted/50 px-6 py-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total Amount</span>
                    <span className="font-bold text-lg text-primary">
                      ₹{order?.amount?.total ?? 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Stack spacing="md" className="w-full">
              <Button onClick={handleGoHome} size="lg" className="w-full sm:w-auto">
                <Home className="h-4 w-4" />
                Go to Home
              </Button>

            </Stack>
          </Stack>
        </Container>
      </div>
    </>
  )
}

export default ReceiptPage
