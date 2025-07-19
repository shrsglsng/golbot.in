import Navbar from "../shared/navbar"
import Image from "next/image"
import { PulseLoader } from "react-spinners"
import { useState } from "react"
import { useRouter } from "next/router"

function Home() {
  const [isBtnLoading, setIsBtnLoading] = useState<boolean>(false)
  const router = useRouter()
  return (
    <>
      <div className="w-full fixed top-0 z-10">
        <Navbar />
      </div>
      <div className="w-full grid place-items-center">
        <div className="w-full md:w-1/2 lg:w-1/4 p-4 flex flex-col items-center">
          <div className="h-20" />
          <div className="h-64 w-full py-5">
            {/* <Carousel /> */}
            <div className="relative h-full w-full">
              <Image src={"/packed-food.webp"} alt="" fill={true} />
            </div>
          </div>
          <div className="h-12" />

          <div className="text-lg text-center">
            Order your favorite snacks from the vending machine
          </div>
          <div className="h-5" />
          <button
            onClick={() => {
              setIsBtnLoading(true)
              router.push("/m01/")
            }}
            className="p-3 bg-cblue rounded-md text-white">
            {isBtnLoading ? (
              <PulseLoader
                color="#fff"
                size={10}
                cssOverride={{ margin: "0px", padding: "0px" }}
              />
            ) : (
              "Start Order"
            )}
          </button>
        </div>
      </div>
    </>
  )
}

export default Home
