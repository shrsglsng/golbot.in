import Head from "next/head"
import Link from "next/link"
import Navbar from "@/shared/navbar"
import { Container } from "@/components/layout/Container"
import { Card, CardContent } from "@/components/ui/card"
import { Package, MapPin, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/router"

function Shipping() {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>Shipping Policy - GolBot</title>
        <meta name="description" content="Learn about our shipping and collection policy" />
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
                  <Package className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                Shipping Policy
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
                Instant on-site collection - no shipping required
              </p>
            </div>
          </Container>
        </div>

        <Container size="lg" className="py-16">
          {/* No Shipping Notice */}
          <Card className="shadow-xl mb-12 border-none bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">No Shipping Required</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Shipping is not applicable for this business model. All orders are collected instantly from the vending machine.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collection Process */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Collection Process</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <Card className="shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">Instant Preparation</h3>
                  <p className="text-sm text-muted-foreground">
                    Orders are prepared fresh on the spot
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">On-Site Collection</h3>
                  <p className="text-sm text-muted-foreground">
                    Collect immediately from the vending machine
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Package className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">No Delivery</h3>
                  <p className="text-sm text-muted-foreground">
                    Delivery services are not available
                  </p>
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card className="shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">No Storage</h3>
                  <p className="text-sm text-muted-foreground">
                    Items cannot be stored or collected later
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Important Points */}
          <Card className="shadow-lg mb-12 border-l-4 border-l-primary">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-4">Important Information</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">✓</span>
                  </div>
                  <span>All items ordered through GolBot vending machines must be collected immediately from the vending machine at the time of order completion.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">✓</span>
                  </div>
                  <span>This is an instant, on-site service where orders are prepared fresh and ready for immediate collection.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">✓</span>
                  </div>
                  <span>Collection happens immediately after payment confirmation and preparation.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Returns and Questions */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-4">Returns & Refunds</h3>
                <p className="text-muted-foreground mb-4">
                  Any returns or refunds are processed as per our Refund Policy. If you experience any issues with your order,
                  please use the &quot;Report an Issue&quot; button on the receipt page immediately after your order.
                </p>
                <Link href="/refund-policy">
                  <Button variant="outline" className="w-full">
                    View Refund Policy
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-4">Questions?</h3>
                <p className="text-muted-foreground mb-6">
                  If you have any questions about our collection process, we&apos;re here to help.
                </p>
                <div className="space-y-3">
                  <a
                    href="mailto:mail@aibotink.com"
                    className="block text-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    mail@aibotink.com
                  </a>
                  <a
                    href="tel:+918095132345"
                    className="block text-center px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    +91 80 9513 2345
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </div>
    </>
  )
}

export default Shipping
