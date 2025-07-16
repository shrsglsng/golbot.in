import Navbar from "../../../../shared/navbar"

function PaymentPending() {
  return (
    <>
      <div className="w-full fixed top-0 z-10">
        <Navbar />
      </div>
      <div className="w-screen h-screen p-4 flex flex-col items-center">
        <div className="h-20" />
        <div className="h-full grid place-items-center">
          Payment is in pending state. Please wait.
        </div>
      </div>
    </>
  )
}

export default PaymentPending
