import Head from "next/head"
import Navbar from "@/shared/navbar"
import { Container } from "@/components/layout/Container"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { FileText, Shield } from "lucide-react"

function Terms() {
  return (
    <>
      <Head>
        <title>Terms and Conditions - GolBot</title>
        <meta name="description" content="Terms and conditions for using GolBot services" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Navbar />

        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-primary to-primary-dark text-white py-20 mt-[72px]">
          <Container size="lg">
            <div className="text-center space-y-4 animate-fade-in">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                Terms & Conditions
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
                Please read these terms carefully before using our services
              </p>
            </div>
          </Container>
        </div>

        <Container size="lg" className="py-16">
          {/* Introduction */}
          <Card className="shadow-xl mb-8 border-none bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
            <CardContent className="p-8 md:p-12">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Welcome to GOLBOT.in. Please read these Terms and Conditions carefully before using our website and services.
                By accessing or using our website and services, you agree to comply with and be bound by these Terms and Conditions.
                If you do not agree to these Terms and Conditions, please do not use our website or services.
              </p>
            </CardContent>
          </Card>

          {/* Terms Accordion */}
          <Card className="shadow-xl">
            <CardContent className="p-6 md:p-8">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-lg font-semibold">
                    1. Use of Our Website
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">1.1.</strong> You must be at least 12 years old to use our website and services.
                      </p>
                      <p>
                        <strong className="text-foreground">1.2.</strong> You agree to use our website and services for lawful purposes only and in a manner consistent with all applicable laws and regulations.
                      </p>
                      <p>
                        <strong className="text-foreground">1.3.</strong> You may not use our website to engage in any harmful, fraudulent, or malicious activities, including but not limited to hacking, distributing malware, or engaging in any activity that could disrupt or interfere with our services.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-lg font-semibold">
                    2. Ordering Food
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">2.1.</strong> When you place an order through our website, you agree to provide accurate and complete information, including your contact for any refund issue arising.
                      </p>
                      <p>
                        <strong className="text-foreground">2.2.</strong> Orders are subject to availability and confirmation. We reserve the right to refuse or cancel any order at our discretion.
                      </p>
                      <p>
                        <strong className="text-foreground">2.3.</strong> You are responsible for ensuring the accuracy of your order before submitting it. Once an order is confirmed, it cannot be modified or canceled.
                      </p>
                      <p>
                        <strong className="text-foreground">2.4.</strong> Prices and payment terms for all items are specified on our website and are subject to change without notice.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-lg font-semibold">
                    3. Privacy Policy
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2 text-muted-foreground">
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">3.1. Information We Collect</h4>
                        <p className="mb-2">
                          <strong className="text-foreground">3.1.1. Personal Information:</strong> We may collect personal information, such as your name, email address, and phone number when you place an order through our website.
                        </p>
                        <p className="mb-2">
                          <strong className="text-foreground">3.1.2. Usage Information:</strong> We may collect information about your use of our website and services, including your IP address, browser type, device information, and browsing patterns.
                        </p>
                        <p>
                          <strong className="text-foreground">3.1.3. Cookies:</strong> We use cookies and similar tracking technologies to enhance your experience on our website. Cookies are small text files that are stored on your device. You can manage your cookie preferences through your browser settings.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">3.2. Information Sharing</h4>
                        <p className="mb-2">
                          <strong className="text-foreground">3.2.1.</strong> We do not sell, trade, or rent your personal information to third parties. However, we may share your information with:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Service providers and partners who assist us in providing our services.</li>
                          <li>Legal authorities when required by law or to protect our rights.</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-lg font-semibold">
                    4. Intellectual Property
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">4.1.</strong> All content, trademarks, and intellectual property on our website are owned by or licensed to GolBot Vending Machines. You may not use, reproduce, or distribute any content from our website without our prior written consent.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-lg font-semibold">
                    5. Limitation of Liability
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">5.1.</strong> We make every effort to ensure the accuracy and availability of our website and services. However, we do not guarantee that our website will be error-free, uninterrupted, or free from viruses or other harmful components.
                      </p>
                      <p>
                        <strong className="text-foreground">5.2.</strong> We are not responsible for any damages or losses that may result from your use of our website or services, including but not limited to direct, indirect, incidental, consequential, or punitive damages.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-lg font-semibold">
                    6. Changes to Terms and Conditions
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">6.1.</strong> We reserve the right to modify or update these Terms and Conditions at any time without prior notice. It is your responsibility to review these Terms and Conditions periodically for any changes.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger className="text-lg font-semibold">
                    7. Contact Information
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2 text-muted-foreground">
                      <p>
                        If you have any questions or concerns about these Terms and Conditions, please contact us at{' '}
                        <a href="mailto:mail@aibotink.com" className="text-primary hover:underline font-medium">
                          mail@aibotink.com
                        </a>.
                      </p>
                      <p>
                        By using our website and services, you acknowledge that you have read, understood, and agreed to these Terms and Conditions. Thank you for choosing GOLBOT.in.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </Container>
      </div>
    </>
  )
}

export default Terms
