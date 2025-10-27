import Navbar from "../../shared/navbar"
import Link from "next/link"
import { useRouter } from "next/router"
import { useSelector, useDispatch } from "react-redux"
import { selectOrder, clearOrder } from "../../redux/orderSlice"
import { selectCart, clearCart } from "../../redux/cartSlice"
import { useEffect, useState } from "react"
import { getLatestOrder } from "../../services/order"

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
      <div className="w-full fixed top-0 z-10">
        <Navbar />
      </div>
      <div className="w-full grid place-items-center">
        <div className="w-full md:w-1/2 lg:w-1/4 h-screen p-5 flex flex-col items-center">
          <div className="h-20" />
          
          {/* Cancelled Header */}
          <div className="w-full text-center mb-6">
            <div className="text-red-500 text-4xl mb-2">❌</div>
            <div className="text-2xl font-bold text-gray-800 mb-2">
              Order Cancelled
            </div>
            <div className="text-gray-600">
              Your order has been cancelled. If this was unexpected, please contact support.
            </div>
          </div>

          {/* Order Info */}
          {orderInfo && (
            <div className="w-full m-5 border rounded-md flex flex-col bg-white shadow-lg">
              {/* Header */}
              <div className="bg-red-50 p-4 border-b">
                <div className="text-center font-semibold text-red-700">Cancelled Order</div>
                {orderInfo?.oid && (
                  <div className="text-center text-sm text-gray-500 mt-1">
                    Order ID: {orderInfo.oid.toString().slice(-8)}
                  </div>
                )}
              </div>
              
              {/* Order Details */}
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className="text-red-600 font-semibold">CANCELLED</span>
                </div>
                {orderInfo.amount && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Amount:</span>
                    <span className="font-semibold">₹{orderInfo.amount.total}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleGoHome}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Home
            </button>
          </div>
          
          <div className="h-6" />
          
          {/* Help Section */}
          <div className="text-center">
            <div className="text-sm text-gray-500">
              Need help with your cancelled order?{" "}
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

export default CancelledPage