import Navbar from "../../shared/navbar"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/router"
import { useSelector, useDispatch } from "react-redux"
import { selectOrder, clearOrder } from "../../redux/orderSlice"
import { selectCart, clearCart } from "../../redux/cartSlice"
import { ItemModel } from "../../models/itemModel"
import { useEffect } from "react"

function ItemRow({
  itemName,
  qty,
  price,
}: Readonly<{
  itemName: string
  qty: number
  price: number
}>) {
  return (
    <div
      className={`w-full p-3 pl-5 flex justify-between ${
        qty == 0 ? "hidden" : ""
      }`}>
      <div className="flex">
        <div className="mt-1">
          <Image src="/vegIcon.svg" height={14} width={14} alt="" />
        </div>
        <div className="pl-3 m-0">
          <span className="text-lg">{itemName}</span>{" "}
          <span className="font-bold">x</span> {qty}
        </div>
      </div>
      <div className="font-bold">₹{price * qty}</div>
    </div>
  )
}

function ReceiptPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const order = useSelector(selectOrder)
  const items = useSelector(selectCart)

  useEffect(() => {
    // If no order data available, redirect to main page
    if (!order && (!items || items.length === 0)) {
      router.replace(`/${router.query.mid}`)
      return
    }

    // Clear cart and order from Redux store since order is complete
    dispatch(clearCart())
    // Reset order to initial state
    dispatch(clearOrder({}))
    
    // Auto-redirect to main page after 30 seconds with success notification
    const timeout = setTimeout(() => {
      router.replace(`/${router.query.mid}?orderComplete=true`)
    }, 30000)

    return () => clearTimeout(timeout)
  }, [router, dispatch, order, items])

  return (
    <>
      <div className="w-full fixed top-0 z-10">
        <Navbar />
      </div>
      <div className="w-full grid place-items-center">
        <div className="w-full md:w-1/2 lg:w-1/4 h-screen p-5 flex flex-col items-center">
          <div className="h-20" />
          
          {/* Success Header */}
          <div className="w-full text-center mb-6">
            <div className="text-green-500 text-4xl mb-2">✅</div>
            <div className="text-2xl font-bold text-gray-800 mb-2">
              Order Complete!
            </div>
            <div className="text-gray-600">
              Thank you for your order. Enjoy your meal!
            </div>
          </div>
          
          {/* Order Receipt */}
          <div className="w-full m-5 border rounded-md flex flex-col bg-white shadow-lg">
            {/* Header */}
            <div className="bg-gray-50 p-4 border-b">
              <div className="text-center font-semibold text-gray-700">Order Receipt</div>
              {order?.oid && (
                <div className="text-center text-sm text-gray-500 mt-1">
                  Order ID: {order.oid.toString().slice(-8)}
                </div>
              )}
            </div>

            {/* Items */}
            {items.map((item: ItemModel) => (
              <div key={item.id || item.name}>
                <ItemRow
                  itemName={item.name}
                  //@ts-ignore
                  qty={order?.itemQty?.[item.id] || item.quantity || 0}
                  price={item.price}
                />
              </div>
            ))}
            
            {/* Spacer */}
            <div className="h-3" />
            <div className="w-full grid place-items-center">
              <div className="w-10/12 h-[1px] border-b-2 border-dashed border-gray-500" />
            </div>

            {/* Total and taxes */}
            <div className="h-4" />
            <div className="px-3 pl-5 flex justify-between">
              <div className="text-gray-500">Price : </div>
              <div className="font-semibold text-lg">
                ₹{order?.amount?.price ?? 0}
              </div>
            </div>
            <div className="h-1" />
            <div className="px-3 pl-5 flex justify-between">
              <div className="text-gray-500">Taxes : </div>
              <div className="font-semibold text-lg">
                ₹{order?.amount?.gst ?? 0}
              </div>
            </div>

            <div className="h-3" />
            <div className="p-3 pl-5 flex justify-between bg-gray-50">
              <div className="font-bold text-lg">Total : </div>
              <div className="font-semibold text-lg">
                ₹{order?.amount?.total ?? 0}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => router.replace(`/${router.query.mid}`)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Order Again
            </button>
          </div>

          <div className="h-6" />
          
          {/* Help Section */}
          <div className="text-center">
            <div className="text-sm text-gray-500">
              Having trouble?{" "}
              <span className="text-red-500 underline">
                <Link href={`/${router.query.mid}/reportIssue`}>
                  Report an Issue
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ReceiptPage
