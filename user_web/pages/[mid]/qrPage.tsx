import { useEffect, useState } from "react"
import QRCode from "react-qr-code"
import Link from "next/link"
import { useSelector, useDispatch } from "react-redux"
import { selectOrder, updateOrder } from "../../redux/orderSlice"
import { useRouter } from "next/router"
import Navbar from "../../shared/navbar"
import { getIsOrderPreparing, getOrderOtp } from "../../services/order"

function QRPage() {
  const router = useRouter()
  const order = useSelector(selectOrder)
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  const { mid } = router.query

  // QR Content validation function
  const validateAndGenerateQR = (order: any) => {
    console.log("🔍 QR Generation Debug:");
    console.log("Raw order object:", order);
    console.log("Order OTP:", order?.orderOtp);
    console.log("Order ID:", order?.oid);
    console.log("Order status:", order?.orderStatus);

    if (!order) {
      console.error("❌ No order object");
      return null;
    }

    // Check for OTP in different possible fields
    const otp = order.orderOtp || order.otp || order.OTP;
    console.log("Checking OTP fields:", { orderOtp: order.orderOtp, otp: order.otp, OTP: order.OTP });

    if (!otp) {
      console.error("❌ Missing orderOtp in all possible fields");
      return null;
    }

    // Convert to string and validate length
    const otpString = String(otp);
    if (otpString.length < 4 || otpString.length > 6) {
      console.error("❌ Invalid OTP length:", otpString, "Length:", otpString.length);
      return null;
    }

    const qrContent = {
      otp: otpString,
      orderId: order.oid || order.id || order._id,
      timestamp: Date.now()
    };

    const qrString = JSON.stringify(qrContent);
    console.log("✅ Generated QR Content:", qrString);
    
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
          console.error("❌ Order validation failed:", orderRes);
          setError("No valid order found. Please place a new order.");
          setTimeout(() => {
            router.replace(`/${mid}`)
          }, 3000)
          return
        }

        console.log("✅ Order retrieved successfully:", orderRes);
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
            console.error('Error checking order status:', error)
          }
        }, 3000) // Check every 3 seconds

        setPollingInterval(intervalId)
        
      } catch (error: any) {
        console.error('Error initializing QR page:', error)
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
            console.error('Error checking order status:', error)
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
        <div className="w-full fixed top-0 z-10">
          <Navbar />
        </div>
        <div className="w-full h-screen grid place-items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your order...</p>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <div className="w-full fixed top-0 z-10">
          <Navbar />
        </div>
        <div className="w-full h-screen grid place-items-center">
          <div className="text-center p-8">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-gray-700 mb-4">{error}</p>
            <button
              onClick={() => router.replace(`/${mid}`)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Go Back to Menu
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="w-full fixed top-0 z-10">
        <Navbar />
      </div>
      <div className="w-full grid place-items-center">
        <div className="w-screen flex flex-col items-center">
          <div className="h-20" />
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Your Order is Ready!</h1>
            <p className="text-gray-600">Scan the QR code at the vending machine to collect your order</p>
          </div>

          {/* QR Code Section */}
          <div className="w-full md:w-1/2 lg:w-1/4 h-[540px] p-8">
            <div className="w-full h-full p-4 flex flex-col justify-around items-center border border-gray-800 rounded-lg bg-white shadow-lg">
              {(() => {
                console.log("🔄 QR Generation Check:");
                console.log("Order exists:", !!order);
                console.log("Order OTP:", order?.orderOtp);
                console.log("Full order object:", order);
                
                const qrContent = validateAndGenerateQR(order);
                console.log("QR Content result:", qrContent);
                
                if (!qrContent) {
                  return (
                    <div className="text-center">
                      <div className="text-red-500 text-xl mb-2">⚠️</div>
                      <div className="text-red-600 font-medium mb-2">QR Generation Issue</div>
                      <div className="text-sm text-gray-600 mb-4">Checking order data...</div>
                      
                      {/* Debug panel - always show in development */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="text-xs text-left bg-gray-100 p-3 rounded mt-4 max-w-xs">
                          <div className="font-bold mb-2">🔍 Debug Info:</div>
                          <div>Has Order: {order ? 'Yes' : 'No'}</div>
                          <div>orderOtp: {order?.orderOtp || 'Missing'}</div>
                          <div>otp: {order?.otp || 'Missing'}</div>
                          <div>OTP: {order?.OTP || 'Missing'}</div>
                          <div>Order ID: {order?.oid || order?.id || 'Missing'}</div>
                          <div>Status: {order?.orderStatus || 'Unknown'}</div>
                          <div className="mt-2 break-all">
                            <strong>Raw:</strong><br/>
                            {JSON.stringify(order, null, 1)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                
                return (
                  <>
                    <QRCode
                      value={JSON.stringify(qrContent)}
                      size={200}
                    />

                    {/* Debug info for development */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-100 rounded max-w-xs">
                        <div className="font-bold mb-1">✅ QR Generated:</div>
                        <div>OTP: {qrContent.otp}</div>
                        <div>Order: {qrContent.orderId}</div>
                        <div>Time: {qrContent.timestamp}</div>
                        <div className="mt-1 break-all">
                          <strong>JSON:</strong><br/>
                          {JSON.stringify(qrContent)}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="w-[80%] h-0.5 bg-slate-600" />

              <div className="text-center">
                <div className="text-sm text-gray-500 mb-2">Order Code</div>
                <div className="text-3xl font-bold tracking-wider">
                  {order?.orderOtp || order?.otp || order?.OTP || 'N/A'}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Valid for this order only
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center px-8 max-w-md">
            <div className="font-medium text-xl text-gray-700 mb-4">
              Scan this QR from our Machine
            </div>
            <div className="text-sm text-gray-500 mb-6">
              Alternatively, you can enter the 6-digit code manually on the machine
            </div>
            
            {/* Order Status Indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="animate-pulse h-3 w-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-green-600 font-medium">Waiting for machine scan...</span>
            </div>
          </div>

          {/* Help Section */}
          <div className="text-center">
            <div className="">
              Having trouble?{" "}
              <span className="text-red-500 underline">
                <Link href={`/${router.query.mid}/reportIssue`}>
                  Report an Issue
                </Link>
              </span>
            </div>
          </div>
          
          <div className="h-10" />
        </div>
      </div>
    </>
  )
}

export default QRPage
