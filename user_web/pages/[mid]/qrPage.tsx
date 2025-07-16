import { useEffect, useState } from "react"
import QRCode from "react-qr-code"
import Link from "next/link"
import { useSelector } from "react-redux"
import { selectOrder, updateOrder } from "../../redux/orderSlice"
import { useRouter } from "next/router"
import { GetServerSideProps } from "next/types"
import Navbar from "../../shared/navbar"
import { selectUser } from "../../redux/userSlice"
import { getIsOrderPreparing, getOrderOtp } from "../../services/order"
import { useDispatch } from "react-redux"

function QRPage() {
  const router = useRouter()
  const order = useSelector(selectOrder)
  // const user = useSelector(selectUser);
  const dispatch = useDispatch()

  const { mid } = router.query

  useEffect(() => {
    if (!mid) return
    ;(async () => {
      const orderRes = await getOrderOtp()
      if (orderRes) dispatch(updateOrder({ order: orderRes }))
      else {
        router.replace(`/${router.query.mid}`)
        return
      }

      var tmpInterval = setInterval(async () => {
        if (await getIsOrderPreparing()) {
          router.replace(`/${router.query.mid}/receipt`)
          clearInterval(tmpInterval)
        }
      }, 3000)
    })()
  }, [mid])

  return (
    <>
      <div className="w-full fixed top-0 z-10">
        <Navbar />
      </div>
      <div className="w-full grid place-items-center">
        <div className="w-screen flex flex-col items-center">
          <div className="h-20" />
          {/* QR Code */}
          {/* <div className="h-5" /> */}
          <div className="w-full md:w-1/2 lg:w-1/4 h-[540px] p-8">
            <div className="w-full h-full p-4 flex flex-col justify-around items-center border border-gray-800 rounded-lg">
              <QRCode
                value={JSON.stringify({
                  otp: order?.orderOtp ?? "",
                })}
              />

              <div className="w-[80%] h-0.5 bg-slate-600" />

              <div>
                <div className="text-3xl font-bold">
                  CODE : {order?.orderOtp ?? ""}
                </div>
              </div>
            </div>
          </div>

          {/* Other data */}
          <div className="h-8" />
          {/* <div className="font-medium text-xl text-gray-700">
          Order Status : <span className="text-cblue">{order?.ostatus}</span>{" "}
        </div> */}

          <div className="font-medium text-xl text-gray-700 text-center">
            Scan this QR from our Machine
          </div>

          <div className="h-16" />
          <div className="">
            Having trouble?{" "}
            <span className="text-red-500 underline">
              {" "}
              <Link href={`/${router.query.mid}/reportIssue`}>
                {" "}
                Report an Issue{" "}
              </Link>
            </span>
          </div>
          <div className="h-5" />
        </div>
      </div>
    </>
  )
}

export default QRPage

// export const getServerSideProps: GetServerSideProps = async (context) => {
//   if (!context.req.headers.referer) {
//     return {
//       redirect: { permanent: false, destination: `/${context.query.mid}` },
//     };
//   }

//   return {
//     props: {},
//   };
// };
