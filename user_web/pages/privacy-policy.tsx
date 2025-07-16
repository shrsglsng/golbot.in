import Navbar from "../shared/navbar"

function Privacy() {
  return (
    <>
      <div className="w-full fixed top-0 z-10">
        <Navbar />
      </div>
      <div className="w-screen p-4 flex flex-col">
        <div className="h-20" />
        <div className="h-5" />
        <div className="text-2xl text-center font-bold">Privacy Policy</div>
        <div className="h-5" />
        <div className="text-left text-lg font-semibold">
          1. Information We Collect
        </div>
        <div className="whitespace-pre-wrap">{`
1.1. Personal Information: We may collect personal information, such as your name, email address, and phone number when you place an order for PaniPuri through our website.

1.2. Usage Information: We may collect information about your use of our website and services, including your IP address, browser type, device information, and browsing patterns.

1.3. Cookies: We use cookies and similar tracking technologies to enhance your experience on our website. Cookies are small text files that are stored on your device. You can manage your cookie preferences through your browser settings.

`}</div>
        <div className="h-5" />
        <div className="text-left text-lg font-semibold">
          2 Information Sharing
        </div>

        <div className="whitespace-pre-wrap">{`
2.1. We do not sell, trade, or rent your personal information to third parties. However, we may share your information with:

2.2 Service providers and partners who assist us in providing our services.
Legal authorities when required by law or to protect our rights.
`}</div>
      </div>
    </>
  )
}

export default Privacy
