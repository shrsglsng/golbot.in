import Navbar from "../shared/navbar"

function Shipping() {
  return (
    <>
      <div className="w-full fixed top-0 z-10">
        <Navbar />
      </div>
      <div className="w-screen p-4 flex flex-col items-center">
        <div className="h-20" />
        <div className="text-2xl">Shipping Policy</div>
        <div className="whitespace-pre-wrap">{`
Shipping is not applicable for this business. The items to be collected by the customers immediately from the vending machine. Any returns/refunds are processed as per our refund policy.
`}</div>
      </div>
    </>
  )
}

export default Shipping
