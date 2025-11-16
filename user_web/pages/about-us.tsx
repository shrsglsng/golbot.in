import Head from "next/head"
import Navbar from "@/shared/navbar"
import { Container } from "@/components/layout/Container"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Zap, Target, Sparkles, Users, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/router"

function AboutUs() {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>About Us - GolBot</title>
        <meta name="description" content="Learn about GolBot and our mission to revolutionize vending" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Navbar />

        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-primary to-primary-dark text-white py-20 mt-[72px]">
          <Container size="lg">
            <div className="text-center space-y-4 animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                About GolBot
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
                Redefining how you enjoy fresh snacks through innovation and technology
              </p>
            </div>
          </Container>
        </div>

        <Container size="lg" className="py-16">
          {/* Mission Statement */}
          <Card className="shadow-xl mb-12 border-none bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">Our Mission</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Welcome to GolBot Vending Machines, where we&apos;re redefining how you enjoy fresh snacks.
                    Our mission is to make ordering delicious food from a vending machine a delightful and accessible
                    experience for everyone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Journey Card */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-primary">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Our Journey</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Our founders&apos; passion for innovation inspired a journey of technological advancement.
                  After years of dedicated work, we&apos;ve developed advanced vending machines that bring
                  authentic taste to your fingertips.
                </p>
              </CardContent>
            </Card>

            {/* Vision Card */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-primary">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Our Vision</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  We aim to spread the joy of convenient, quality food globally while maintaining authentic flavors.
                  Our machines offer food lovers around the world a convenient and hygienic way to savor their
                  favorite snacks.
                </p>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-12" />

          {/* Call to Action Section */}
          <Card className="shadow-xl bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8 md:p-12">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold">Join Our Revolution</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Explore our website, discover our vending machines, and redefine your snacking experience.
                  Whether you&apos;re a customer, a business owner looking to offer this service, or an investor,
                  we have exciting opportunities for you.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button
                    size="lg"
                    className="group"
                    onClick={() => router.push("/order")}
                  >
                    Start Ordering
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push("/contact")}
                  >
                    Contact Us
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

export default AboutUs
