import Image from "next/image"
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew"
import { PulseLoader } from "react-spinners"

import CloseIcon from "@mui/icons-material/Close"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { useSelector } from "react-redux"
import { selectCart, updateCart } from "../../redux/cartSlice"
import { ItemModel } from "../../models/itemModel"
import { useDispatch } from "react-redux"
import { placeOrder } from "../../services/order"
import { updateOrder } from "../../redux/orderSlice"
import { GetServerSideProps } from "next/types"
import Navbar from "../../shared/navbar"

// @ts-ignore
import { load } from "@cashfreepayments/cashfree-js"

function ItemCard({ item, index }: { item: ItemModel; index: number }) {
  const dispatch = useDispatch()

  const handleButtonOnClick = (action: "+" | "-") => {
    if (action === "+" && item.quantity < 10) {
      dispatch(
        updateCart({ item: { ...item, quantity: item.quantity + 1 }, index })
      )
    } else if (action === "-" && item.quantity > 1) {
      dispatch(
        updateCart({ item: { ...item, quantity: item.quantity - 1 }, index })
      )
    }
  }

  return (
    <div className="h-36 py-5 w-full flex">
      {/* image */}
      <div className="flex-grow-[0.35] basis-0 flex flex-col justify-center">
        <div className="relative h-full w-full">
          <Image src={"/paniPuri.png"} alt="" fill={true} className="rounded-md" />
        </div>
      </div>

      {/* item desc */}
      <div className="flex-grow-[0.65] basis-0 pl-5 flex flex-col">
        <div>{item.name}</div>
        <div className="h-3" />
        <div>₹{item.price}</div>
        <div className="h-3" />
        {/* add or sub buttons */}
        <div className="flex w-full">
          <button
            className="px-2 text-white bg-cblue hover:bg-cbluel rounded-md"
            onClick={() => handleButtonOnClick("-")}>
            −
          </button>
          <div className="w-3" />
          <div>{item.quantity}</div>
          <div className="w-3" />
          <button
            className="px-2 text-white bg-cblue hover:bg-cbluel rounded-md"
            onClick={() => handleButtonOnClick("+")}>
            +
          </button>

          <button
            onClick={() => {
              dispatch(updateCart({ item: { ...item, quantity: 0 }, index }))
            }}
            className="ml-auto">
            <CloseIcon className="text-gray-500" fontSize="small" />
          </button>
        </div>
      </div>
    </div>
  )
}

function CheckoutPage() {
  const router = useRouter()
  const items = useSelector(selectCart)
  const dispatch = useDispatch()
  const { mid } = router.query

  const [isConBtnLoading, setIsConBtnLoading] = useState<boolean>(false)

  const [amount, setAmount] = useState({
    price: 0,
    gst: 0,
    total: 0,
  })

  const handleConfirmBtnClick = async () => {
    setIsConBtnLoading(true)
    const order = await placeOrder(items, mid?.toString() ?? "")
    if (order) {
      dispatch(updateOrder({ order: order.order }))
      window.location.href = order.paymentUrl.toString()
      // router.push(`/${mid}/qrPage`);
    }
    setIsConBtnLoading(false)
  }

  useEffect(() => {
    var tmp = 0,
      tmp2 = 0
    items.forEach((ele: ItemModel) => {
      tmp += ele.price * ele.quantity
      tmp2 += ele.gst * ele.quantity
    })

    setAmount({ ...amount, price: tmp, gst: tmp2, total: tmp + tmp2 })

    // redirect to home page if cart is empty
    if (tmp === 0) router.push(`/${mid}`)
  }, [items])

  return (
    <>
      <div className="w-full fixed top-0 z-10">
        <Navbar />
      </div>
      <div className="w-full grid place-items-center">
        <div className="w-full md:w-1/2 lg:w-1/4 p-8 flex flex-col">
          <div className="h-20" />

          {/* topbar */}
          <div className="flex w-full">
            <button onClick={() => router.push(`/${mid}`)} className="">
              <ArrowBackIosNewIcon fontSize="small" />
            </button>
            <div className="flex-1 basis-0 text-lg text-center">My Cart</div>
          </div>

          {/* checkout items */}
          <div className="h-5" />
          <div className="w-full flex flex-col">
            {items.map((item: ItemModel, i: number) => (
              <div key={i}>
                {item.quantity > 0 && <ItemCard item={item} index={i} />}
              </div>
            ))}
          </div>
          <div
            className={`w-full h-40 grid place-items-center ${
              amount.total === 0 ? "block" : "hidden"
            }`}>
            <div className="text-lg text-gray-500">Your Cart is Empty...</div>
          </div>

          {/* coupoun code section */}

          {/* <div className="h-5" />
        <div className="w-full flex flex-col">
          <div className="text-lg font-bold">Promo Code</div>
          <div className="h-3" />
          <div className="w-full relative">
            <button className="absolute m-1 px-4 bottom-0 top-0 right-1 bg-cblue hover:bg-cbluel text-white rounded-lg">
              Apply
            </button>
            <input
              className="w-full p-3 border border-1 border-gray-400 rounded-lg"
              type="text"
              placeholder="Enter promo code"
            />
          </div>
        </div> */}

          {/* price section */}

          <div className="h-12" />
          <div className="flex flex-col">
            <div className="flex justify-between">
              <div className="text-gray-500">Price : </div>
              <div className="font-semibold text-lg">₹{amount.price}</div>
            </div>
            <div className="h-3" />
            <div className="flex justify-between">
              <div className="text-gray-500">Taxes : </div>
              <div className="font-semibold text-lg">₹{amount.gst}</div>
            </div>

            <div className="h-3" />
            <div className="w-full h-[1px] border-b-2 border-dashed border-gray-500" />

            <div className="h-3" />
            <div className="flex justify-between">
              <div className="font-bold text-lg">Total : </div>
              <div className="font-semibold text-lg">₹{amount.total}</div>
            </div>
          </div>
        </div>

        {/* place order button */}

        <div className="h-12" />

        <button
          onClick={handleConfirmBtnClick}
          disabled={amount.total <= 0 ? true : false}
          className={`w-full md:w-1/2 lg:w-1/4 py-3 hover:bg-cbluel rounded-md text-white ${
            amount.total <= 0 ? "bg-cbluel" : "bg-cblue"
          }`}>
          {isConBtnLoading ? (
            <PulseLoader
              color="#fff"
              size={10}
              cssOverride={{ margin: "0px", padding: "0px" }}
            />
          ) : (
            "Confirm Order"
          )}
        </button>
      </div>
    </>
  )
}

export default CheckoutPage

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (!context.req.headers.referer) {
    return {
      redirect: { permanent: false, destination: `/${context.query.mid}` },
    }
  }

  return {
    props: {},
  }
}
