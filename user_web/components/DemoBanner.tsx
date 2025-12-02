// user_web/components/DemoBanner.tsx

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { isDemoMode, getDemoCredentials } from "../config/demoConfig";

export function DemoBanner() {
  if (!isDemoMode()) return null;

  const { phone, otp } = getDemoCredentials();

  return (
    <Alert className="border-2 border-yellow-400 bg-yellow-50 mb-6">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800">
        🎪 Demo Mode Active
      </AlertTitle>
      <AlertDescription className="text-yellow-700 mt-2">
        <div className="space-y-2">
          <p className="font-semibold">Use these credentials to test:</p>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="bg-white p-2 rounded border border-yellow-300">
              <p className="text-xs text-gray-600">Phone Number</p>
              <p className="font-mono font-bold text-lg">{phone}</p>
            </div>
            <div className="bg-white p-2 rounded border border-yellow-300">
              <p className="text-xs text-gray-600">OTP</p>
              <p className="font-mono font-bold text-lg">{otp}</p>
            </div>
          </div>
          <p className="text-xs mt-3 italic">
            ⚠️ Demo mode is for testing only. No SMS charges will be incurred.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}