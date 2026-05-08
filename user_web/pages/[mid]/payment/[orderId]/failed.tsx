import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/Container"
import { Stack } from "@/components/layout/Stack"
import { XCircle, Home, RotateCcw, AlertTriangle } from "lucide-react"

export default function PaymentFailedPage() {
  const router = useRouter()
  const { mid, orderId } = router.query

  return (
    <>
      <Head>
        <title>Payment Failed - GolBot</title>
        <meta name="description" content="Your payment failed or was cancelled" />
      </Head>

      <div className="min-h-screen flex items-center justify-center p-4">
        <Container size="sm">
          <Card className="shadow-2xl border-destructive/20 animate-fade-in">
            <CardContent className="p-12">
              <Stack spacing="xl" align="center">
                {/* Error Icon */}
                <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-destructive" />
                </div>

                {/* Error Message */}
                <Stack spacing="sm" align="center">
                  <h1 className="text-3xl md:text-4xl font-bold text-destructive text-center">
                    Payment Failed
                  </h1>
                  <p className="text-muted-foreground text-center max-w-md">
                    Your payment could not be processed or was cancelled
                  </p>
                </Stack>

                {/* Order ID */}
                {orderId && (
                  <div className="w-full bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground text-center mb-1">
                      Order ID
                    </p>
                    <p className="font-mono text-sm font-medium text-center break-all">
                      {orderId}
                    </p>
                  </div>
                )}

                {/* Info Notice */}
                <div className="w-full bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Don&apos;t worry! No charges were made to your account. You can try placing your order again.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button
                    onClick={() => router.push(`/${mid}`)}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Try Again
                  </Button>
                  <Button
                    onClick={() => router.push(`/${mid}`)}
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <Home className="h-4 w-4" />
                    Go to Home
                  </Button>
                </div>

              </Stack>
            </CardContent>
          </Card>
        </Container>
      </div>
    </>
  )
}
