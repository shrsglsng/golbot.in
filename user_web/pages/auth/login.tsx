// user_web/pages/auth/login.tsx - WITH MACHINE ID AUTO-FILL

import Head from "next/head";
import { useEffect, useState } from "react";
import { sendOtp, verifyOtp } from "../../services/auth";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import Logo from "../../shared/logo";
import { updateOrder } from "../../redux/orderSlice";
import { getLatestOrder } from "../../services/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Stack } from "@/components/layout/Stack";
import { toast } from "@/hooks/use-toast";
import { Smartphone, KeyRound, Cpu } from "lucide-react";
import { getLoginRedirectPath } from "../../utils/machineStorage";

// Demo mode imports
import { isDemoMode, getDemoCredentials } from "../../config/demoConfig";
import { isDemoPhoneNumber } from "../../services/auth";
// NEW: Machine ID imports
import { isDemoMode as isMachineDemoMode, getDemoMachineId } from "../../config/machineConfig";

const INIT_STATE = {
  phone: "",
  OTP: "",
  machineId: "",
};

export default function Login() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldData, setFieldData] = useState(INIT_STATE);
  const [errField, setErrField] = useState(INIT_STATE);
  // NEW: Step to track login progress
  const [step, setStep] = useState(1); // 1: phone, 2: OTP, 3: machine ID

  useEffect(() => {
    if (localStorage.getItem("Token") != null) {
      const redirectPath = router.query.next?.toString()
        ? `/${router.query.next}`
        : getLoginRedirectPath("/");
      router.replace(redirectPath);
    }

    // Auto-fill demo credentials
    if (isDemoMode()) {
      const { phone, otp } = getDemoCredentials();
      setFieldData((prev) => ({
        ...prev,
        phone,
        OTP: otp,
      }));
    }

    // NEW: Auto-fill machine ID
    if (isMachineDemoMode()) {
      const machineId = getDemoMachineId();
      setFieldData((prev) => ({
        ...prev,
        machineId,
      }));
    }
  }, [router, dispatch]);

  const handleBtnOnClick = async () => {
    setIsLoading(true);
    setErrField(INIT_STATE);

    if (fieldData.phone.length !== 10) {
      setErrField((f) => ({ ...f, phone: "Invalid Phone Number" }));
      toast.error("Invalid Phone", "Please enter a valid 10-digit phone number");
      setIsLoading(false);
      return;
    }

    if (!otpSent) {
      const success = await sendOtp(fieldData.phone);
      if (success) {
        setOtpSent(true);
        setStep(2);
        toast.success("OTP Sent", "Please check your phone for the OTP");
      } else {
        toast.error("Failed", "Could not send OTP. Please try again.");
      }
    } else {
      if (fieldData.OTP.length !== 6) {
        setErrField((f) => ({ ...f, OTP: "Enter 6-digit OTP" }));
        toast.error("Invalid OTP", "Please enter a 6-digit OTP");
        setIsLoading(false);
        return;
      }

      const user = await verifyOtp(fieldData.phone, fieldData.OTP, dispatch);
      if (!user) {
        setErrField((f) => ({ ...f, OTP: "Invalid OTP" }));
        toast.error("Login Failed", "Invalid OTP. Please try again.");
        setIsLoading(false);
        return;
      }

      const nextMachineId = router.query.next ? router.query.next.toString() : null;

      if (nextMachineId) {
        // Auto-select machine from QR code
        if (typeof window !== "undefined") {
          sessionStorage.setItem("selectedMachineId", nextMachineId);
        }
        
        toast.success("Login Successful", `Connected to machine: ${nextMachineId}`);
        
        const redirectPath = `/${nextMachineId}`;
        dispatch(updateOrder({ order: await getLatestOrder() }));
        router.replace(redirectPath);
      } else {
        toast.success("OTP Verified", "Please enter machine ID to continue");
        // Move to manual machine ID step
        setStep(3);
        setOtpSent(false);
      }
    }

    setIsLoading(false);
  };

  // NEW: Handle machine ID submission
  const handleMachineIdSubmit = async () => {
    setIsLoading(true);
    setErrField(INIT_STATE);

    if (fieldData.machineId.trim().length === 0) {
      setErrField((f) => ({ ...f, machineId: "Machine ID is required" }));
      toast.error("Invalid Machine ID", "Please enter a machine ID");
      setIsLoading(false);
      return;
    }

    // Store machine ID in sessionStorage or Redux for later use
    if (typeof window !== "undefined") {
      sessionStorage.setItem("selectedMachineId", fieldData.machineId);
    }

    toast.success("Machine Selected", `Using machine: ${fieldData.machineId}`);
    
    const redirectPath = router.query.next?.toString()
      ? `/${router.query.next}`
      : getLoginRedirectPath("/");
    
    dispatch(updateOrder({ order: await getLatestOrder() }));
    router.replace(redirectPath);

    setIsLoading(false);
  };

  return (
    <>
      <Head>
        <title>Login | GolBot</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 relative">
        <div className="max-w-md mx-auto mt-8 relative z-10">
          <Card className="border-2">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex justify-center mb-4 relative z-10">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <Logo />
                </div>
              </div>
              <CardTitle className="text-center text-2xl">Login</CardTitle>
              <CardDescription className="text-center">
                {step === 1 && "Enter your phone number to continue"}
                {step === 2 && "Enter the OTP to verify"}
                {step === 3 && "Select your machine to proceed"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Stack className="w-full">
                {/* Step 1: Phone Input */}
                {step === 1 && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="flex items-center gap-2 text-sm font-medium"
                    >
                      <Smartphone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter 10-digit phone number"
                      value={fieldData.phone}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/[^0-9]/g, "")
                          .slice(0, 10);
                        setFieldData({ ...fieldData, phone: value });
                      }}
                      disabled={isLoading}
                      maxLength={10}
                      className="text-lg tracking-wide"
                    />
                    {errField.phone && (
                      <p className="text-red-500 text-sm">{errField.phone}</p>
                    )}
                  </div>
                )}

                {/* Step 2: OTP Input */}
                {step === 2 && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="otp"
                      className="flex items-center gap-2 text-sm font-medium"
                    >
                      <KeyRound className="w-4 h-4" />
                      OTP
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={fieldData.OTP}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/[^0-9]/g, "")
                          .slice(0, 6);
                        setFieldData({ ...fieldData, OTP: value });
                      }}
                      disabled={isLoading}
                      maxLength={6}
                      className="text-lg tracking-[0.5em]"
                    />
                    {errField.OTP && (
                      <p className="text-red-500 text-sm">{errField.OTP}</p>
                    )}
                  </div>
                )}

                {/* NEW: Step 3: Machine ID Input */}
                {step === 3 && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="machineId"
                      className="flex items-center gap-2 text-sm font-medium"
                    >
                      <Cpu className="w-4 h-4" />
                      Machine ID
                    </Label>
                    <Input
                      id="machineId"
                      type="text"
                      placeholder="Enter machine ID (e.g., M02)"
                      value={fieldData.machineId}
                      onChange={(e) => {
                        setFieldData({
                          ...fieldData,
                          machineId: e.target.value.toUpperCase(),
                        });
                      }}
                      disabled={isLoading}
                      className="text-lg tracking-wide uppercase"
                    />
                    {errField.machineId && (
                      <p className="text-red-500 text-sm">{errField.machineId}</p>
                    )}
                  </div>
                )}

                {/* Step 1 & 2: OTP Flow Buttons */}
                {(step === 1 || step === 2) && (
                  <>
                    <Button
                      onClick={handleBtnOnClick}
                      disabled={isLoading}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading
                        ? "Loading..."
                        : step === 1
                        ? "Send OTP"
                        : "Verify OTP"}
                    </Button>

                    {step === 2 && (
                      <Button
                        onClick={() => {
                          setStep(1);
                          setFieldData({ ...fieldData, OTP: "" });
                          setOtpSent(false);
                        }}
                        variant="outline"
                        className="w-full"
                        disabled={isLoading}
                      >
                        Change Phone Number
                      </Button>
                    )}
                  </>
                )}

                {/* NEW: Step 3: Machine ID Button */}
                {step === 3 && (
                  <>
                    <Button
                      onClick={handleMachineIdSubmit}
                      disabled={isLoading}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? "Processing..." : "Continue with Machine"}
                    </Button>

                    <Button
                      onClick={() => {
                        setStep(2);
                        setOtpSent(true);
                      }}
                      variant="outline"
                      className="w-full"
                      disabled={isLoading}
                    >
                      Change OTP
                    </Button>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Footer Text */}
          <p className="text-center text-sm text-gray-500 mt-6">
            {step === 1 && "We'll send you an OTP to verify your phone number"}
            {step === 2 && "Enter the OTP sent to your phone"}
            {step === 3 && "Select your machine to start ordering"}
          </p>
        </div>
      </div>
    </>
  );
}