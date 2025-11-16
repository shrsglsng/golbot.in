import Head from "next/head"
import Navbar from "@/shared/navbar"
import { Container } from "@/components/layout/Container"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Shield, Lock } from "lucide-react"

function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - GolBot</title>
        <meta name="description" content="Learn how GolBot protects your privacy and data" />
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
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                Privacy Policy
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
                Your privacy and data security are our top priorities
              </p>
            </div>
          </Container>
        </div>

        <Container size="lg" className="py-16">
          {/* Introduction */}
          <Card className="shadow-xl mb-8 border-none bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  At GolBot, we are committed to protecting your privacy and ensuring the security of your personal information.
                  This Privacy Policy explains how we collect, use, and safeguard your data.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Accordion */}
          <Card className="shadow-xl">
            <CardContent className="p-6 md:p-8">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-lg font-semibold">
                    1. Information We Collect
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">1.1. Personal Information:</strong> We may collect personal information,
                        such as your name, email address, and phone number when you place an order through our website.
                      </p>
                      <p>
                        <strong className="text-foreground">1.2. Usage Information:</strong> We may collect information about your use
                        of our website and services, including your IP address, browser type, device information, and browsing patterns.
                      </p>
                      <p>
                        <strong className="text-foreground">1.3. Cookies:</strong> We use cookies and similar tracking technologies to
                        enhance your experience on our website. Cookies are small text files that are stored on your device. You can manage
                        your cookie preferences through your browser settings.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-lg font-semibold">
                    2. Information Sharing
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">2.1.</strong> We do not sell, trade, or rent your personal information to
                        third parties. However, we may share your information with:
                      </p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Service providers and partners who assist us in providing our services.</li>
                        <li>Legal authorities when required by law or to protect our rights.</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-lg font-semibold">
                    3. Your Rights
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2 text-muted-foreground">
                      <p>
                        You have the right to access, update, or delete your personal information at any time. If you have any questions
                        or concerns about our privacy practices, please contact us at{' '}
                        <a href="mailto:mail@aibotink.com" className="text-primary hover:underline font-medium">
                          mail@aibotink.com
                        </a>.
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

export default Privacy
