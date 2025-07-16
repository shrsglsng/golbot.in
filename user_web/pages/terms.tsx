import Navbar from "../shared/navbar"

function Terms() {
  return (
    <>
      <div className="w-full fixed top-0 z-10">
        <Navbar />
      </div>
      <div className="w-screen p-4 flex flex-col">
        <div className="h-20" />
        <div className="text-2xl font-bold text-center">
          Terms and Conditions
        </div>
        <div className="whitespace-pre-wrap">{`
Welcome to the GOLBOT.in. Please read these Terms and Conditions carefully before using our website and services. By accessing or using our website and services, you agree to comply with and be bound by these Terms and Conditions. If you do not agree to these Terms and Conditions, please do not use our website or services.

`}</div>
        <div className="text-left text-lg font-semibold">
          1. Use of Our Website
        </div>

        <div className="whitespace-pre-wrap">{`
1.1. You must be at least 12 years old to use our website and services.

1.2. You agree to use our website and services for lawful purposes only and in a manner consistent with all applicable laws and regulations.

1.3. You may not use our website to engage in any harmful, fraudulent, or malicious activities, including but not limited to hacking, distributing malware, or engaging in any activity that could disrupt or interfere with our services.

`}</div>
        <div className="text-left text-lg font-semibold">
          2. Ordering PaniPuri
        </div>
        <div className="whitespace-pre-wrap">{`
2.1. When you place an order for PaniPuri through our website, you agree to provide accurate and complete information, including your contact for any refund issue arising.

2.2. Orders are subject to availability and confirmation. We reserve the right to refuse or cancel any order at our discretion.

2.3. You are responsible for ensuring the accuracy of your order before submitting it. Once an order is confirmed, it cannot be modified or canceled.

2.4. Prices and payment terms for all items are specified on our website and are subject to change without notice.

`}</div>
        <div className="text-left text-lg font-semibold">3. Privacy Policy</div>
        <div className="h-5" />
        <div className="text-left text-lg font-semibold">
          3.1. Information We Collect
        </div>

        <div className="whitespace-pre-wrap">{`
3.1.1. Personal Information: We may collect personal information, such as your name, email address, and phone number when you place an order for PaniPuri through our website.

3.1.2. Usage Information: We may collect information about your use of our website and services, including your IP address, browser type, device information, and browsing patterns.

3.1.3. Cookies: We use cookies and similar tracking technologies to enhance your experience on our website. Cookies are small text files that are stored on your device. You can manage your cookie preferences through your browser settings.

`}</div>

        <div className="text-left text-lg font-semibold">
          3.2 Information Sharing
        </div>

        <div className="whitespace-pre-wrap">{`
3.2.1. We do not sell, trade, or rent your personal information to third parties. However, we may share your information with:

3.2.2Service providers and partners who assist us in providing our services.
Legal authorities when required by law or to protect our rights.

`}</div>

        <div className="text-left text-lg font-semibold">
          4. Intellectual Property
        </div>

        <div className="whitespace-pre-wrap">{`
4.1. All content, trademarks, and intellectual property on our website are owned by or licensed to PaniPuri Vending Machines. You may not use, reproduce, or distribute any content from our website without our prior written consent.

`}</div>
        <div className="text-left text-lg font-semibold">
          5. Limitation of Liability
        </div>
        <div className="whitespace-pre-wrap">{`
5.1. We make every effort to ensure the accuracy and availability of our website and services. However, we do not guarantee that our website will be error-free, uninterrupted, or free from viruses or other harmful components.

5.2. We are not responsible for any damages or losses that may result from your use of our website or services, including but not limited to direct, indirect, incidental, consequential, or punitive damages.

`}</div>

        <div className="text-left text-lg font-semibold">
          6. Changes to Terms and Conditions
        </div>
        <div className="whitespace-pre-wrap">{`
6.1. We reserve the right to modify or update these Terms and Conditions at any time without prior notice. It is your responsibility to review these Terms and Conditions periodically for any changes.

`}</div>

        <div className="text-left text-lg font-semibold">
          7. Contact Information
        </div>

        <div className="whitespace-pre-wrap">{`
If you have any questions or concerns about these Terms and Conditions, please contact us at mail@aibotink.com.

By using our website and services, you acknowledge that you have read, understood, and agreed to these Terms and Conditions. Thank you for choosing GOLBOT.in.

        `}</div>
      </div>
    </>
  )
}

export default Terms
