import Head from "next/head"
import Navbar from "../shared/navbar"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Container } from "@/components/layout/Container"
import { Stack } from "@/components/layout/Stack"
import { ArrowRight, Zap, Sparkles, Target } from "lucide-react"
import { getSavedMachineId } from "../utils/machineStorage"

function Home() {
  const [isNavigating, setIsNavigating] = useState<boolean>(false)
  const router = useRouter()

  const handleStartOrder = () => {
    setIsNavigating(true)
    const savedMid = getSavedMachineId()
    if (savedMid) {
      // Redirect to saved machine's menu
      router.push(`/${savedMid}`)
    } else {
      // No saved machine, go to order page to enter code
      router.push("/order")
    }
  }

  return (
    <>
      <Head>
        <title>GolBot - Smart Vending Solutions</title>
        <meta name="description" content="Order your favorite snacks from smart vending machines" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero Section */}
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-orange-900 to-orange-600">
          {/* Background Image with Gradient Overlay */}
          <div className="absolute inset-0 z-0">
            {/* Mobile Image - golbot1.png */}
            <Image
              src="/golbot1.png"
              alt="GolBot - Fresh snacks"
              fill
              className="object-cover object-center md:hidden"
              priority
            />
            {/* Desktop Image - golbot2.png */}
            <Image
              src="/golbot2.png"
              alt="GolBot - Fresh snacks"
              fill
              className="object-cover object-center hidden md:block"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-background" />
          </div>

          {/* Content */}
          <Container size="lg" className="relative z-10 py-32">
            <Stack spacing="xl" align="center">
              {/* Hero Text */}
              <div className="text-center space-y-6 animate-fade-in">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Your Favorite Snacks,
                  <br />
                  <span className="text-primary">Just a Tap Away</span>
                </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                  Experience the future of vending. Quick, contactless, and delicious.
                </p>
              </div>

              {/* CTA Button */}
              <div className="animate-slide-in-from-bottom">
                <Button
                  onClick={handleStartOrder}
                  size="lg"
                  className="text-lg px-10 py-7 shadow-2xl hover:shadow-primary/50 transition-all group rounded-full"
                  loading={isNavigating}
                >
                  <span className="font-semibold">Start Your Order</span>
                  <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Stack>
          </Container>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="h-8 w-5 rounded-full border-2 border-white/50 flex items-start justify-center p-1">
              <div className="h-2 w-1 bg-white/50 rounded-full" />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <Container size="lg" className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose GolBot?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the future of vending with our smart, contactless machines
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="shadow-lg hover:shadow-xl transition-all border-none bg-gradient-to-br from-white to-orange-50/20">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
                <p className="text-muted-foreground">
                  Order and collect your favorite snacks in seconds. No waiting, no hassle.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="shadow-lg hover:shadow-xl transition-all border-none bg-gradient-to-br from-white to-orange-50/20">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Always Fresh</h3>
                <p className="text-muted-foreground">
                  Every item is prepared fresh on-site, ensuring quality and taste with every order.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="shadow-lg hover:shadow-xl transition-all border-none bg-gradient-to-br from-white to-orange-50/20">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Contactless & Safe</h3>
                <p className="text-muted-foreground">
                  Fully automated, contactless experience for your safety and convenience.
                </p>
              </CardContent>
            </Card>
          </div>
        </Container>

        {/* How It Works Section */}
        <div className="bg-gradient-to-b from-muted/30 to-background py-20">
          <Container size="lg">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Three simple steps to satisfy your cravings
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative">
                <Card className="shadow-lg hover:shadow-xl transition-all h-full">
                  <CardContent className="p-8">
                    <div className="absolute -top-4 left-8">
                      <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl shadow-lg">
                        1
                      </div>
                    </div>
                    <div className="mt-8">
                      <h3 className="text-xl font-bold mb-3">Scan QR Code</h3>
                      <p className="text-muted-foreground">
                        Find a GolBot vending machine near you and scan the QR code to open the menu on your phone.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <Card className="shadow-lg hover:shadow-xl transition-all h-full">
                  <CardContent className="p-8">
                    <div className="absolute -top-4 left-8">
                      <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl shadow-lg">
                        2
                      </div>
                    </div>
                    <div className="mt-8">
                      <h3 className="text-xl font-bold mb-3">Choose & Pay</h3>
                      <p className="text-muted-foreground">
                        Browse the menu, select your items, and complete the payment securely through your phone.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <Card className="shadow-lg hover:shadow-xl transition-all h-full">
                  <CardContent className="p-8">
                    <div className="absolute -top-4 left-8">
                      <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl shadow-lg">
                        3
                      </div>
                    </div>
                    <div className="mt-8">
                      <h3 className="text-xl font-bold mb-3">Collect & Enjoy</h3>
                      <p className="text-muted-foreground">
                        Your order is prepared fresh. Collect it from the machine and enjoy your delicious snack!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Container>
        </div>

        {/* CTA Section */}
        <Container size="lg" className="py-20">
          <Card className="shadow-2xl bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 overflow-hidden">
            <CardContent className="p-12 md:p-16">
              <div className="text-center space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">Ready to Get Started?</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Find a GolBot vending machine near you and experience the future of snacking today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button
                    size="lg"
                    className="text-lg px-10 py-7 shadow-xl group"
                    onClick={handleStartOrder}
                  >
                    Start Ordering Now
                    <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-10 py-7"
                    onClick={() => router.push("/about-us")}
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </div>
    </>
  )
}

export default Home
