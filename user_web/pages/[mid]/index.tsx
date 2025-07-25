// Helper to get order status from either ostatus or orderStatus
function getOrderStatus(order: { ostatus?: string; orderStatus?: string }): string | undefined {
  return order.ostatus ?? order.orderStatus;
}
import Head from "next/head"
import { useEffect, useState } from "react"
import { getLatestOrder } from "../../services/order"
import { selectOrder, updateOrder } from "../../redux/orderSlice"
import Image from "next/image"
import { useRouter } from "next/router"
import { useSelector, useDispatch } from "react-redux"
import { selectCart, setItems, updateCart } from "../../redux/cartSlice"
import { GetServerSideProps } from "next/types"
import Navbar from "../../shared/navbar"
import { ItemModel as BaseItemModel } from "../../models/itemModel"

// Extend base model to include frontend-specific fields
type ExtendedItemModel = BaseItemModel & {
  quantity: number
  availableQty: number
}

function PuriCard({ item, index }: Readonly<{ item: ExtendedItemModel; index: number }>) {
  const dispatch = useDispatch()

  function handleBtnClick(action: "+" | "-") {
    if (action === "+" && item.quantity < 10) {
      dispatch(updateCart({ item: { ...item, quantity: item.quantity + 1 }, index }))
    } else if (action === "-" && item.quantity > 0) {
      dispatch(updateCart({ item: { ...item, quantity: item.quantity - 1 }, index }))
    }
  }

  const renderControls = () => {
    if (!item.isAvailable) {
      return (
        <div className="w-4/5 -mt-5 bg-zinc-200 border border-cblue rounded-md grid place-items-center text-xs text-zinc-500">
          <span>Sold Out</span>
        </div>
      )
    }

    if (item.quantity === 0) {
      return (
        <button
          onClick={() => handleBtnClick("+")}
          className="w-4/5 -mt-5 bg-blue-50 border border-cblue rounded-md place-items-center grid"
        >
          <div className="w-full px-3 py-1 text-cblue text-center font-bold">Add</div>
        </button>
      )
    }

    return (
      <div className="w-4/5 -mt-5 bg-cblue rounded-md place-items-center grid">
        <div className="w-full px-3 py-1 flex justify-between items-center text-white">
          <button onClick={() => handleBtnClick("-")}>−</button>
          <div>{item.quantity}</div>
          <button onClick={() => handleBtnClick("+")}>+</button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-36 w-full p-5 flex">
      <div className="flex-grow-[0.7] basis-0 flex flex-col">
        <Image src="/vegIcon.svg" height={20} width={20} alt="Veg Icon" />
        <div className="h-1" />
        <div>{item.name}</div>
        <div className="h-2" />
        <div>₹{item.price}</div>
        <div className="text-xs text-gray-500">{item.desc}</div>
      </div>

      <div className="flex-grow-[0.3] basis-0 flex flex-col justify-center">
        <div className="relative h-full w-full">
          {item.imgUrl ? (
            <Image
              src={"/paniPuri.png"}
              alt={item.name}
              fill
              className="rounded-md object-cover"
              sizes="(max-width: 768px) 120px, 140px"
            />
          ) : (
            <div className="h-full w-full bg-gray-200 flex items-center justify-center rounded-md text-sm text-gray-500">
              No Image
            </div>
          )}
        </div>

        <div className="w-full relative h-4 flex justify-center">{renderControls()}</div>
      </div>
    </div>
  )
}

export default function Home({ allItems }: Readonly<{ allItems: ExtendedItemModel[] }>) {
  const router = useRouter()
  const dispatch = useDispatch()
  const items = useSelector(selectCart) as ExtendedItemModel[]
  const reduxOrder = useSelector(selectOrder)
  const { mid } = router.query
  const [total, setTotal] = useState(0)
  const [showOrderStrip, setShowOrderStrip] = useState(false)
  const [pendingOrder, setPendingOrder] = useState<any>(null)
  const [loadingOrder, setLoadingOrder] = useState(true)
  // Fetch latest order on mount
  useEffect(() => {
    setLoadingOrder(true)
    getLatestOrder().then((order) => {
      console.log("Latest Order:", order)
      const status = getOrderStatus(order || {});
      if (order && ["PAID", "OTP_VERIFIED", "PREPARING", "READY_FOR_PICKUP"].includes(status || "")) {
        setPendingOrder(order)
        dispatch(updateOrder({ order }))
      } else {
        setPendingOrder(null)
      }
      setLoadingOrder(false)
    })
  }, [dispatch])

  useEffect(() => {
    dispatch(setItems({ allItems }))
  }, [dispatch, allItems])

  useEffect(() => {
    let tmp = 0
    items.forEach((ele) => {
      if (!isNaN(ele.price) && !isNaN(ele.quantity)) {
        tmp += ele.price * ele.quantity
      }
    })
    setTotal(tmp)
  }, [items])

  useEffect(() => {
    // Check if user came from order completion
    if (router.asPath.includes('fromOrderComplete=true')) {
      setShowOrderStrip(true)
      
      // Hide the strip after 10 seconds
      const stripTimeout = setTimeout(() => {
        setShowOrderStrip(false)
      }, 10000)

      return () => clearTimeout(stripTimeout)
    }
  }, [router.asPath])

  // Show loading while checking for pending order
  if (loadingOrder) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-lg text-gray-500">Checking your order status...</div>
      </div>
    )
  }

  // If a pending order exists, block new orders and show Resume Order button
  if (pendingOrder) {
    const status = getOrderStatus(pendingOrder);
    let resumePath = `/${mid}`;
    if (status === "PAID" && pendingOrder.orderOtp) {
      resumePath = `/${mid}/qrPage`;
    } else if (status === "OTP_VERIFIED" || status === "PREPARING") {
      resumePath = `/${mid}/preparingOrder`;
    } else if (status === "READY_FOR_PICKUP") {
      resumePath = `/${mid}/preparingOrder`;
    }
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50">
        <Navbar />
        <div className="flex flex-1 w-full items-center justify-center">
          <div className="bg-white shadow-lg rounded-xl px-10 py-12 flex flex-col items-center max-w-md w-full border border-gray-200">
            <div className="text-2xl font-bold mb-2 text-gray-800 text-center">You have a pending order</div>
            <div className="mb-8 text-gray-600 text-center text-base">Please complete your current order before starting a new one.</div>
            <button
              onClick={() => router.push(resumePath)}
              className="px-8 py-3 bg-blue-600 text-white rounded-md text-lg font-semibold shadow hover:bg-blue-700 transition"
            >
              Resume Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No pending order, show normal menu
  return (
    <>
      <Head>
        <title>GolBot</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="w-full fixed top-0 z-10">
        <Navbar />
      </div>

      {/* Green strip for order completion */}
      {showOrderStrip && (
        <div className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-4 px-6 fixed top-16 z-10 shadow-md border-b border-green-400 animate-in slide-in-from-top-5 duration-500">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div className="animate-in fade-in-50 duration-700 delay-200">
              <p className="text-center font-semibold text-sm tracking-wide animate-pulse">
                🍽️ Your order is being prepared
              </p>
            </div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce animation-delay-300"></div>
          </div>
          {/* Progress bar animation */}
          <div className="mt-2 w-full bg-green-700 bg-opacity-30 rounded-full h-1">
            <div className="bg-white h-1 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}

      <div className="w-full grid place-items-center">
        <div className="w-full md:w-1/2 lg:w-1/4 flex flex-col">
          <div className="w-full flex flex-col overflow-y-auto">
            <div className="h-20" />
            <div className="h-64 py-5">
              <div className="relative h-full w-full">
                <Image 
                  src={"/packed-food.webp"} 
                  alt="Header Banner" 
                  fill 
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>
            </div>

            {Array.isArray(items) && items.length > 0 ? (
              items.map((item, i) => {
                const uniqueKey = item.id ? `item-${item.id}` : `item-index-${i}`;
                return (
                  <div key={uniqueKey}>
                    <PuriCard item={item} index={i} />
                    {i !== items.length - 1 && (
                      <div className="h-2 bg-white grid place-items-center px-5">
                        <div className="h-[0.5px] w-full bg-black" />
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-500 py-10">Loading menu...</div>
            )}

            <div className="flex-grow bg-gray-200" />
          </div>
          <div className="h-20" />
        </div>

        <div className="fixed bottom-0 w-full md:w-1/2 lg:w-1/4 p-3 bg-white">
          <button
            onClick={() => router.push(`/${mid}/checkout`)}
            disabled={total <= 0}
            className={`w-full p-3 rounded-md ${
              total <= 0 ? "bg-cbluel" : "bg-cblue hover:bg-cbluel"
            }`}
          >
            <div className="text-lg text-white">
              Add to Order - ₹{Intl.NumberFormat("en-IN").format(total)}
            </div>
          </button>
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { mid } = context.params as { mid: string };

  if (!process.env.NEXT_PUBLIC_SERVER_URL) {
    throw new Error("Server Url Not Set");
  }

  const machineRes = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/machine/${mid}`
  );

  if (machineRes.status === 404) {
    return { notFound: true };
  }

  const itemsRes = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/getAllItems`);
  const json = await itemsRes.json();
  const rawItems = json.data?.items ?? [];

  const allItems: ExtendedItemModel[] = rawItems.map((item: BaseItemModel) => ({
    ...item,
    availableQty: item.qtyLeft ?? 0,
    quantity: 0,
  }));

  return {
    props: { allItems },
  };
};

