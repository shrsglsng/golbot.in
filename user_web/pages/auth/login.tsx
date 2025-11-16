import Head from "next/head"
import { useEffect, useState } from "react"
import { sendOtp, verifyOtp } from "../../services/auth"
import { useRouter } from "next/router"
import { useDispatch } from "react-redux"
import Logo from "../../shared/logo"
import { updateOrder } from "../../redux/orderSlice"
import { getLatestOrder } from "../../services/order"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Stack } from "@/components/layout/Stack"
import { toast } from "@/hooks/use-toast"
import { Smartphone, KeyRound } from "lucide-react"
import { getLoginRedirectPath } from "../../utils/machineStorage"

const INIT_STATE = { phone: "", OTP: "" }

export default function Login() {
  const router = useRouter()
  const dispatch = useDispatch()

  const [otpSent, setOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fieldData, setFieldData] = useState(INIT_STATE)
  const [errField, setErrField] = useState(INIT_STATE)

  useEffect(() => {
    if (localStorage.getItem("Token") != null) {
      const redirectPath = router.query.next?.toString()
        ? `/${router.query.next}`
        : getLoginRedirectPath("/");
      router.replace(redirectPath);
    }
  }, [])

  const handleBtnOnClick = async () => {
    setIsLoading(true)
    setErrField(INIT_STATE)

    if (fieldData.phone.length !== 10) {
      setErrField((f) => ({ ...f, phone: "Invalid Phone Number" }))
      toast.error("Invalid Phone", "Please enter a valid 10-digit phone number")
      setIsLoading(false)
      return
    }

    if (!otpSent) {
      const success = await sendOtp(fieldData.phone)
      if (success) {
        setOtpSent(true)
        toast.success("OTP Sent", "Please check your phone for the OTP")
      } else {
        toast.error("Failed", "Could not send OTP. Please try again.")
      }
    } else {
      if (fieldData.OTP.length !== 6) {
        setErrField((f) => ({ ...f, OTP: "Enter 6-digit OTP" }))
        toast.error("Invalid OTP", "Please enter a 6-digit OTP")
        setIsLoading(false)
        return
      }

      const user = await verifyOtp(fieldData.phone, fieldData.OTP, dispatch)
      if (!user) {
        setErrField((f) => ({ ...f, OTP: "Invalid OTP" }))
        toast.error("Login Failed", "Invalid OTP. Please try again.")
        setIsLoading(false)
        return
      }

      toast.success("Login Successful", "Redirecting...")
      const redirectPath = router.query.next?.toString()
        ? `/${router.query.next}`
        : getLoginRedirectPath("/");
      router.replace(redirectPath)
      dispatch(updateOrder({ order: await getLatestOrder() }))
    }

    setIsLoading(false)
  }

  return (
    <>
      <Head>
        <title>Login - GolBot</title>
        <meta name="description" content="Login with OTP" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen flex flex-col">
        {/* Top bar with logo */}
        <div className="h-20 px-4 flex items-center bg-primary shadow-lg">
          <Button
            variant="ghost"
            className="h-12 px-2 hover:bg-primary-light"
            onClick={() => router.push("/")}
          >
            <div className="relative w-28 h-12">
              <Logo />
            </div>
          </Button>
        </div>

        {/* Login Form */}
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl animate-fade-in">
            <CardHeader className="text-center space-y-2">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>
                Enter your phone number to receive an OTP
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Stack spacing="lg">
                {/* Phone input */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center px-3 border border-input bg-muted rounded-md text-sm font-medium">
                      +91
                    </div>
                    <Input
                      id="phone"
                      disabled={otpSent}
                      error={!!errField.phone}
                      type="tel"
                      value={fieldData.phone}
                      onChange={(e) =>
                        setFieldData((f) => ({
                          ...f,
                          phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                        }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleBtnOnClick()}
                      autoFocus
                      placeholder="Enter 10-digit number"
                      className="flex-1"
                    />
                  </div>
                  {errField.phone && (
                    <p className="text-sm text-destructive">{errField.phone}</p>
                  )}
                </div>

                {/* OTP input */}
                {otpSent && (
                  <div className="space-y-2 animate-slide-in-from-top">
                    <Label htmlFor="otp" className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4" />
                      Enter OTP
                    </Label>
                    <Input
                      id="otp"
                      error={!!errField.OTP}
                      type="text"
                      value={fieldData.OTP}
                      onChange={(e) =>
                        setFieldData((f) => ({
                          ...f,
                          OTP: e.target.value.replace(/\D/g, "").slice(0, 6),
                        }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleBtnOnClick()}
                      placeholder="6-digit OTP"
                      className="font-mono text-lg tracking-widest"
                    />
                    {errField.OTP && (
                      <p className="text-sm text-destructive">{errField.OTP}</p>
                    )}

                    {/* Resend OTP */}
                    <Button
                      variant="link"
                      size="sm"
                      className="px-0 h-auto"
                      onClick={async () => {
                        setIsLoading(true)
                        const success = await sendOtp(fieldData.phone)
                        if (success) {
                          toast.success("OTP Resent", "Check your phone")
                        }
                        setIsLoading(false)
                      }}
                    >
                      Resend OTP
                    </Button>
                  </div>
                )}

                {/* Submit button */}
                <Button
                  onClick={handleBtnOnClick}
                  loading={isLoading}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {otpSent ? "Verify & Login" : "Send OTP"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
