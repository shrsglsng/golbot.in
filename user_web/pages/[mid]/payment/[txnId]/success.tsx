import { useRouter } from "next/router";
import { useEffect } from "react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { mid, txnId } = router.query;

  useEffect(() => {
    // Optionally: verify payment status from backend using txnId
  }, [txnId]);

  return (
    <div className="h-screen w-full grid place-items-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-green-600">Payment Successful!</h1>
        <p className="mt-4 text-gray-700">Order ID: {txnId}</p>
        <button
          className="mt-6 px-4 py-2 bg-cblue text-white rounded-md"
          onClick={() => router.push(`/${mid}`)}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
