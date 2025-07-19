import Image from "next/image"
import Navbar from "../../shared/navbar"
import { useEffect } from "react"
import { useRouter } from "next/router"
import { getIsOrderPreparing } from "../../services/order"

function PreparingOrder() {
  const router = useRouter()
  const { mid } = router.query

  useEffect(() => {
    if (!mid) return

    let isMounted = true
    let intervalId: NodeJS.Timeout | null = null

    const checkOrderStatus = async () => {
      try {
        if (!isMounted) return
        
        const isStillPreparing = await getIsOrderPreparing()
        if (!isMounted) return
        
        if (!isStillPreparing) {
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
          if (isMounted) {
            router.replace(`/${router.query.mid}?fromOrderComplete=true`)
          }
        }
      } catch (error) {
        console.error('Error checking order status:', error)
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
  return (
    <>
      <div className="w-full fixed top-0 z-10">
        <Navbar />
      </div>
      {/*  */}
      <div className="w-full grid place-items-center">
        <div className="w-full md:w-1/2 lg:w-1/4 h-screen p-5 flex flex-col items-center">
          <div className="h-20" />
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
          <div className="text-xl">Preparing your order Please wait...</div>
        </div>
      </div>
    </>
  )
}

export default PreparingOrder
