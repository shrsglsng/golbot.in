import Image from "next/image"
import Navbar from "../../shared/navbar"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { useSelector } from "react-redux"
import { selectOrder } from "../../redux/orderSlice"
import { getIsOrderPreparing, getLatestOrder, getIsOrderCancelled } from "../../services/order"

function PreparingOrder() {
  const router = useRouter()
  const { mid } = router.query
  const [isLoading, setIsLoading] = useState(true)
  const [orderInfo, setOrderInfo] = useState<any>(null)
  const order = useSelector(selectOrder)

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
        <div className="w-full fixed top-0 z-10">
          <Navbar />
        </div>
        <div className="w-full h-screen grid place-items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Checking order status...</p>
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
        <div className="w-full md:w-1/2 lg:w-1/4 h-screen p-5 flex flex-col items-center">
          <div className="h-20" />
          
          {/* Cooking Animation */}
          <div className="relative h-[40%] w-full">
            <Image
              src="/cooking.gif"
              alt="Cooking animation"
              fill={true}
              className="rounded-md"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          </div>
          
          <div className="h-8" />
          
          {/* Status Message */}
          <div className="text-center">
            {(() => {
              const status = orderInfo?.orderStatus;
              if (status === 'OTP_VERIFIED') {
                return (
                  <>
                    <div className="text-xl font-semibold text-blue-600 mb-2">
                      Order Verified!
                    </div>
                    <div className="text-gray-600 mb-4">
                      Your order has been verified. Machine is starting preparation...
                    </div>
                  </>
                );
              } else if (status === 'PREPARING') {
                return (
                  <>
                    <div className="text-xl font-semibold text-orange-600 mb-2">
                      Preparing your order
                    </div>
                    <div className="text-gray-600 mb-4">
                      Please wait while our machine prepares your delicious food...
                    </div>
                  </>
                );
              } else if (status === 'READY_FOR_PICKUP') {
                return (
                  <>
                    <div className="text-xl font-semibold text-green-600 mb-2">
                      Order Ready!
                    </div>
                    <div className="text-gray-600 mb-4">
                      Your food is ready! Please collect it from the machine.
                    </div>
                  </>
                );
              } else {
                return (
                  <>
                    <div className="text-xl font-semibold text-gray-800 mb-2">
                      Processing your order
                    </div>
                    <div className="text-gray-600 mb-4">
                      Please wait while we process your order...
                    </div>
                  </>
                );
              }
            })()}
            
            {/* Order Info */}
            {orderInfo && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-600 mb-2">Order Details</div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Order ID:</span>
                  <span className="font-mono text-sm">{orderInfo.oid || orderInfo.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Order Number:</span>
                  <span className="font-semibold text-blue-600">
                    {orderInfo.orderCounter && orderInfo.orderCounter > 0 ? `#${orderInfo.orderCounter}` : 'Payment Required'}
                  </span>
                </div>
              </div>
            )}
            
            {/* Progress Indicator */}
            <div className="flex items-center justify-center">
              {(() => {
                const status = orderInfo?.orderStatus;
                if (status === 'OTP_VERIFIED') {
                  return (
                    <>
                      <div className="animate-pulse h-3 w-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-blue-600 font-medium">Starting Preparation</span>
                    </>
                  );
                } else if (status === 'PREPARING') {
                  return (
                    <>
                      <div className="animate-pulse h-3 w-3 bg-orange-500 rounded-full mr-2"></div>
                      <span className="text-orange-600 font-medium">In Progress</span>
                    </>
                  );
                } else if (status === 'READY_FOR_PICKUP') {
                  return (
                    <>
                      <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-green-600 font-medium">Ready for Pickup</span>
                    </>
                  );
                } else {
                  return (
                    <>
                      <div className="animate-pulse h-3 w-3 bg-gray-500 rounded-full mr-2"></div>
                      <span className="text-gray-600 font-medium">Processing</span>
                    </>
                  );
                }
              })()}
            </div>
          </div>
          
          <div className="h-12" />
          
          {/* Estimated Time */}
          <div className="text-center text-sm text-gray-500">
            <p>Estimated preparation time: 3-5 minutes</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default PreparingOrder
