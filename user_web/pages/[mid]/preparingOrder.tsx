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

    ;(async () => {
      //   console.log(!(await getIsOrderPreparing()));
      if (!(await getIsOrderPreparing())) {
        router.replace(`/${router.query.mid}?fromOrderComplete=true`)
      }

      var tmpInterval = setInterval(async () => {
        if (!(await getIsOrderPreparing())) {
          router.replace(`/${router.query.mid}?fromOrderComplete=true`)
          clearInterval(tmpInterval)
        }
      }, 5000)
    })()
  }, [mid])
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
              alt=""
              fill={true}
              className="rounded-md"
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
