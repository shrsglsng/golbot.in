import Head from "next/head"
import Navbar from "@/shared/navbar"
import { Container } from "@/components/layout/Container"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw, Camera, FileText, Send, CheckCircle2, AlertCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"

function RefundPolicy() {
  return (
    <>
      <Head>
        <title>Refund Policy - GolBot</title>
        <meta name="description" content="Learn about our refund policy and how to report issues" />
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
                  <RefreshCw className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                Refund Policy
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
                We&apos;re here to help resolve any issues promptly
              </p>
            </div>
          </Container>
        </div>

        <Container size="lg" className="py-16">
          {/* Introduction */}
          <Card className="shadow-xl mb-12 border-none bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
            <CardContent className="p-8 md:p-12">
              <p className="text-lg text-muted-foreground leading-relaxed text-center">
                If the GolBot vending machine was unable to dispense the dishes you ordered, we understand your concern
                and are here to assist you promptly. Please follow the steps outlined below to report any issues and request a refund.
              </p>
            </CardContent>
          </Card>

          {/* How to Report - Step by Step */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">How to Report an Issue</h2>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <Card className="shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm mb-2">
                        1
                      </div>
                      <h3 className="text-xl font-bold mb-2">Visit Receipt Page</h3>
                      <p className="text-muted-foreground text-sm">
                        After completing your order, you&apos;ll be directed to a receipt page. Look for the &quot;Report an Issue&quot; button at the bottom.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 2 */}
              <Card className="shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Camera className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm mb-2">
                        2
                      </div>
                      <h3 className="text-xl font-bold mb-2">Document the Issue</h3>
                      <p className="text-muted-foreground text-sm mb-3">
                        Provide evidence of the issue:
                      </p>
                      <ul className="text-muted-foreground text-sm text-left space-y-1">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>Take a photo of the issue</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>Describe in detail</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 3 */}
              <Card className="shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Send className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm mb-2">
                        3
                      </div>
                      <h3 className="text-xl font-bold mb-2">Submit Report</h3>
                      <p className="text-muted-foreground text-sm">
                        After providing both photo and description (required), click &quot;Submit Report&quot; to send your report to our team.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator className="my-12" />

          {/* Process Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Review Process */}
            <Card className="shadow-lg hover:shadow-xl transition-all border-l-4 border-l-primary">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Review Process</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Our GolBot team will review your report promptly. The determination of whether the issue is genuine
                  will be made by our team based on the evidence provided.
                </p>
              </CardContent>
            </Card>

            {/* Refund Process */}
            <Card className="shadow-lg hover:shadow-xl transition-all border-l-4 border-l-primary">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Refund Process</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  If your reported issue is verified and deemed genuine by our GolBot team, we will initiate the refund
                  process. The refund will be processed to your original payment method.
                </p>
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    The time required for the refund to reflect in your account may vary depending on your payment
                    provider&apos;s policies (typically 5-7 business days).
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Card */}
          <Card className="shadow-xl bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
              <p className="text-muted-foreground mb-6">
                If you have any questions about our refund policy or need assistance, we&apos;re here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:mail@aibotink.com"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                >
                  mail@aibotink.com
                </a>
                <a
                  href="tel:+918095132345"
                  className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors font-medium"
                >
                  +91 80 9513 2345
                </a>
              </div>
            </CardContent>
          </Card>
        </Container>
      </div>
    </>
  )
}

export default RefundPolicy
