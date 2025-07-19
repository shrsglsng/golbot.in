import Image from "next/image";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { PulseLoader } from "react-spinners";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { selectCart, updateCart } from "../../redux/cartSlice";
import { placeOrder } from "../../services/order";
import { updateOrder } from "../../redux/orderSlice";
import { GetServerSideProps } from "next/types";
import Navbar from "../../shared/navbar";
import { ItemModel as BaseItemModel } from "../../models/itemModel";

type ExtendedItemModel = BaseItemModel & { quantity: number };

function ItemCard({ item, index }: Readonly<{ item: ExtendedItemModel; index: number }>) {
  const dispatch = useDispatch();

  const handleButtonOnClick = (action: "+" | "-") => {
    if (action === "+" && item.quantity < 10) {
      dispatch(updateCart({ item: { ...item, quantity: item.quantity + 1 }, index }));
    } else if (action === "-" && item.quantity > 1) {
      dispatch(updateCart({ item: { ...item, quantity: item.quantity - 1 }, index }));
    }
  };

  return (
    <div className="h-36 py-5 w-full flex">
      <div className="flex-grow-[0.35] basis-0 flex flex-col justify-center">
        <div className="relative h-full w-full">
          <Image src="/paniPuri.png" alt={item.name} fill className="rounded-md" />
        </div>
      </div>
      <div className="flex-grow-[0.65] basis-0 pl-5 flex flex-col">
        <div>{item.name}</div>
        <div className="h-3" />
        <div>₹{item.price ?? 0}</div>
        <div className="h-3" />
        <div className="flex w-full">
          <button className="px-2 text-white bg-cblue hover:bg-cbluel rounded-md" onClick={() => handleButtonOnClick("-")}>−</button>
          <div className="w-3" />
          <div>{item.quantity}</div>
          <div className="w-3" />
          <button className="px-2 text-white bg-cblue hover:bg-cbluel rounded-md" onClick={() => handleButtonOnClick("+")}>+</button>
          <button onClick={() => dispatch(updateCart({ item: { ...item, quantity: 0 }, index }))} className="ml-auto">
            <CloseIcon className="text-gray-500" fontSize="small" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckoutPage() {
  const router = useRouter();
  const items = useSelector(selectCart);
  const dispatch = useDispatch();
  const { mid } = router.query;

  const [isConBtnLoading, setIsConBtnLoading] = useState(false);
  const [amount, setAmount] = useState({ price: 0, gst: 0, total: 0 });

  const handleConfirmBtnClick = async () => {
    setIsConBtnLoading(true);

    try {
      // Step 1: Create DB Order
      const result = await placeOrder(items, mid?.toString() ?? "");
      const dbOrder = result?.order;

      if (!dbOrder?.oid) throw new Error("Failed to create order");

      dispatch(updateOrder({ order: dbOrder }));

      // Step 2: Create Razorpay Order
      const razorRes = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/payment/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("Token")}`,
          },
          body: JSON.stringify({ orderId: dbOrder.oid }),
        }
      );

      const razorData = await razorRes.json();
      console.log("Razorpay order response:", razorData);

      if (razorRes.status !== 201 || !razorData?.result?.orderId) {
        throw new Error("Failed to create Razorpay order");
      }

      const { orderId, amount, currency } = razorData.result;

      // Step 3: Open Razorpay Checkout
      const razorpay = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: "Your Brand",
        description: "Order Payment",
        order_id: orderId,
        handler: async function (response: any) {
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;

          try {
            const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/payment/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("Token")}`,
              },
              body: JSON.stringify({
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.status === 200 && verifyData.success) {
              router.push(`/${mid}/payment/${razorpay_order_id}/success`);
            } else {
              alert("Payment verification failed");
              router.push(`/${mid}/payment/${razorpay_order_id}/failed`);
            }
          } catch (err) {
            console.error("❌ Verification error:", err);
            router.push(`/${mid}/payment/${razorpay_order_id}/failed`);
          }
        },
        modal: {
          ondismiss: function () {
            router.push(`/${mid}/payment/${orderId}/failed`);
          },
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#3399cc",
        },
      });

      razorpay.open();
    } catch (err) {
      console.error("❌ Payment initiation failed:", err);
      alert("Something went wrong while creating your order. Please try again.");
    } finally {
      setIsConBtnLoading(false);
    }
  };


  useEffect(() => {
    let tmpPrice = 0;
    let tmpGst = 0;

    items.forEach((ele) => {
      const price = ele.price ?? 0;
      const gst = ele.gst ?? 0;
      tmpPrice += price * ele.quantity;
      tmpGst += gst * ele.quantity;
    });

    const total = tmpPrice + tmpGst;
    setAmount({ price: tmpPrice, gst: tmpGst, total });

    if (total === 0) router.push(`/${mid}`);
  }, [items]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <>
      <div className="w-full fixed top-0 z-10">
        <Navbar />
      </div>
      <div className="w-full grid place-items-center">
        <div className="w-full md:w-1/2 lg:w-1/4 p-8 flex flex-col">
          <div className="h-20" />
          <div className="flex w-full">
            <button onClick={() => router.push(`/${mid}`)}>
              <ArrowBackIosNewIcon fontSize="small" />
            </button>
            <div className="flex-1 basis-0 text-lg text-center">My Cart</div>
          </div>
          <div className="h-5" />
          <div className="w-full flex flex-col">
            {items.map((item, i) => item.quantity > 0 && <ItemCard key={item.id ?? i} item={item} index={i} />)}
          </div>
          <div className={`w-full h-40 grid place-items-center ${amount.total === 0 ? "block" : "hidden"}`}>
            <div className="text-lg text-gray-500">Your Cart is Empty...</div>
          </div>
          <div className="h-12" />
          <div className="flex flex-col">
            <div className="flex justify-between">
              <div className="text-gray-500">Price :</div>
              <div className="font-semibold text-lg">₹{amount.price}</div>
            </div>
            <div className="h-3" />
            <div className="flex justify-between">
              <div className="text-gray-500">Taxes :</div>
              <div className="font-semibold text-lg">₹{amount.gst}</div>
            </div>
            <div className="h-3" />
            <div className="w-full h-[1px] border-b-2 border-dashed border-gray-500" />
            <div className="h-3" />
            <div className="flex justify-between">
              <div className="font-bold text-lg">Total :</div>
              <div className="font-semibold text-lg">₹{amount.total}</div>
            </div>
          </div>
        </div>

        <div className="h-12" />
        <button
          onClick={handleConfirmBtnClick}
          disabled={amount.total <= 0}
          className={`w-full md:w-1/2 lg:w-1/4 py-3 hover:bg-cbluel rounded-md text-white ${amount.total <= 0 ? "bg-cbluel" : "bg-cblue"}`}
        >
          {isConBtnLoading ? (
            <PulseLoader color="#fff" size={10} cssOverride={{ margin: "0px", padding: "0px" }} />
          ) : (
            "Confirm Order"
          )}
        </button>
      </div>
    </>
  );
}

export default CheckoutPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (!context.req.headers.referer) {
    return {
      redirect: { permanent: false, destination: `/${context.query.mid}` },
    };
  }

  return {
    props: {},
  };
};
