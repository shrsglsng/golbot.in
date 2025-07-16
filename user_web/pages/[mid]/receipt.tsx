import Navbar from "../../shared/navbar"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/router"
import { useSelector } from "react-redux"
import { selectOrder } from "../../redux/orderSlice"
import { selectCart } from "../../redux/cartSlice"
import { ItemModel } from "../../models/itemModel"
import { OrderModel } from "../../models/orderModel"

function ReceiptPage() {
  const router = useRouter()
  const order = useSelector(selectOrder)
  const items = useSelector(selectCart)

  function ItemRow({
    itemName,
    qty,
    price,
  }: {
    itemName: string
    qty: number
    price: number
  }) {
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

  return (
    <>
      <div className="w-full fixed top-0 z-10">
        <Navbar />
      </div>
      {/*  */}
      <div className="w-full grid place-items-center">
        <div className="w-full md:w-1/2 lg:w-1/4 h-screen p-5 flex flex-col items-center">
          <div className="h-20" />
          <div className="w-full grid place-items-center text-2xl">
            Thank you for your order
          </div>
          <div className="h-8" />
          <div className="w-full m-5 border rounded-md flex flex-col">
            {/* items */}
            {items.map((item: ItemModel, i: number) => (
              <div key={i}>
                <ItemRow
                  itemName={item.name}
                  //@ts-ignore
                  qty={order?.itemQty[item.id]}
                  price={item.price}
                />
              </div>
            ))}
            {/* spacer */}
            <div className="h-3" />
            <div className="w-full grid place-items-center">
              <div className="w-10/12 h-[1px] border-b-2 border-dashed border-gray-500" />
            </div>

            {/* total and taxes */}
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
            <div className="p-3 pl-5 flex justify-between">
              <div className="font-bold text-lg">Total : </div>
              <div className="font-semibold text-lg">
                ₹{order?.amount?.total ?? 0}
              </div>
            </div>
          </div>

          <div className="h-3" />
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
        </div>
      </div>
    </>
  )
}

export default ReceiptPage
