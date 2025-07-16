import Navbar from "../shared/navbar"

function RefundPolicy() {
  return (
    <>
      <div className="w-full fixed top-0 z-10">
        <Navbar />
      </div>
      <div className="w-screen p-4 flex flex-col items-center">
        <div className="h-20" />
        <div className="text-2xl">Refund Policy</div>
        <div className="whitespace-pre-wrap">{`
If the Golbot was unable to dispense the dishes you ordered, we understand your concern and are here to assist you promptly. Please follow the steps outlined below to report any issues and request a refund:

1. Visit the Thank You Page on the Golbot Website:

After an unsuccessful order, please visit the "Thank You" page on the Golbot website where you placed your order.

2. Locate the "Report" Button:

On the "Thank You" page, you will find a "Report" button located at the bottom of the page.

3. Report the Issue:

You will have two options to report the issue:

   a. Image Option (For Irregularities): If the dispensed dish has irregularities, such as a reduced number of puris or other noticeable issues, you can use the image option. Upload a clear image of the dish as proof of the issue.

   b. Text Box (For Written Descriptions): If the issue doesn't require visual proof but needs a written explanation, you can use the "Report an Issue" text box. Describe your concerns in detail.

4. Submit Your Report:

After providing the necessary information, click the "Submit" button to send your report to us.

Review Process:

Our Golbot executives will review your report promptly. The determination of whether the issue is genuine or related to fraud will be made by our team.

Refund Process:

If your reported issue is verified and deemed genuine by our Golbot executives, we will initiate the refund process. The refund will be processed to your original payment method.

Please note that the time required for the refund to reflect in your account may vary depending on your payment provider's policies.
        `}</div>
      </div>
    </>
  )
}

export default RefundPolicy
