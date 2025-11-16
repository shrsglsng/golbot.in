import Head from "next/head"
import Navbar from "@/shared/navbar"
import { Container } from "@/components/layout/Container"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Building2, MapPin, Phone, Mail, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

function ContactUs() {
  return (
    <>
      <Head>
        <title>Contact Us - GolBot</title>
        <meta name="description" content="Get in touch with GolBot - we're here to help" />
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
                Get in Touch
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
                Our dedicated team is here to support you on your GolBot journey
              </p>
            </div>
          </Container>
        </div>

        <Container size="lg" className="py-16">
          {/* Introduction */}
          <Card className="shadow-xl mb-12 border-none bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
            <CardContent className="p-8 md:p-12 text-center">
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Got questions or need assistance? We&apos;re here to help! Reach out to us through any of the channels below.
              </p>
            </CardContent>
          </Card>

          {/* Contact Cards Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Corporate Office */}
            <Card className="shadow-lg hover:shadow-xl transition-all border-l-4 border-l-primary">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Corporate Office</h2>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="leading-relaxed">
                      <p className="font-semibold text-foreground">Aibot Ink Pvt. Ltd.</p>
                      <p>#22, 2nd Floor, Tanya Towers,</p>
                      <p>2nd Cross, Pampa Extension, Kempapura,</p>
                      <p>Bangalore - 560024</p>
                      <p>Karnataka, India</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registered Office */}
            <Card className="shadow-lg hover:shadow-xl transition-all border-l-4 border-l-primary">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Registered Office</h2>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="leading-relaxed">
                      <p>No. 50, SYNO.4/1 KNO 4668/50,</p>
                      <p>M G Halli, A K Nagar,</p>
                      <p>Bangalore - 560036</p>
                      <p>Karnataka, India</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-12" />

          {/* Contact Methods */}
          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            {/* Phone */}
            <Card className="shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Phone</p>
                    <a
                      href="tel:+918095132345"
                      className="text-lg font-semibold text-primary hover:underline"
                    >
                      +91 80 9513 2345
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email */}
            <Card className="shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                    <a
                      href="mailto:mail@aibotink.com"
                      className="text-lg font-semibold text-primary hover:underline"
                    >
                      mail@aibotink.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <Card className="shadow-xl bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8 md:p-12">
              <div className="text-center space-y-6">
                <h2 className="text-3xl font-bold">Join the Revolution</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Join us in celebrating the joy of fresh, convenient snacking! Whether you&apos;re a customer or
                  looking to partner with us, we&apos;d love to hear from you.
                </p>
                <div className="pt-4">
                  <Button
                    size="lg"
                    onClick={() => window.location.href = "mailto:mail@aibotink.com"}
                  >
                    <Mail className="mr-2 h-5 w-5" />
                    Send us an Email
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

export default ContactUs
