import { useRouter } from "next/router";
import { useEffect } from "react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { mid, txnId } = router.query;

  useEffect(() => {
    if (!mid || !txnId) return;

    const timeout = setTimeout(() => {
      router.replace(`/${mid}/preparingOrder?fromPayment=true`);
    }, 2000); // 2 seconds delay

    return () => clearTimeout(timeout);
  }, [mid, txnId]);

  return (
    <div className="h-screen w-full grid place-items-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-green-600">Payment Successful!</h1>
        <p className="mt-4 text-gray-700">Transaction ID: {txnId}</p>
        <p className="mt-1 text-sm text-gray-500">Redirecting to order preparation...</p>
      </div>
    </div>
  );
}
