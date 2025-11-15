import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../shared/navbar";
import { PulseLoader } from "react-spinners";
import { resolveMachineFromToken, getMachineById, isValidMachineCodeFormat, MachineInfo } from "../services/machine";

export default function OrderPage() {
  const router = useRouter();
  const { mt } = router.query;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [machine, setMachine] = useState<MachineInfo | null>(null);
  const [machineCode, setMachineCode] = useState("");
  const [validatingCode, setValidatingCode] = useState(false);

  // Handle QR code token validation on page load
  useEffect(() => {
    if (mt && typeof mt === "string") {
      validateMachineToken(mt);
    }
  }, [mt]);

  // Validate machine token from QR code
  const validateMachineToken = async (token: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await resolveMachineFromToken(token);

      if (result.success && result.machine) {
        setMachine(result.machine);
        setLoading(false);

        // Auto-redirect to menu page after successful validation
        setTimeout(() => {
          router.push(`/${result.machine!.id}`);
        }, 1500);
      } else {
        setLoading(false);
        setError(
          result.message || "This QR code is invalid or has been deactivated. Please try another machine or enter a machine code manually."
        );
      }
    } catch (err: any) {
      setLoading(false);
      setError("Failed to validate QR code. Please try again or enter a machine code manually.");
    }
  };

  // Handle manual machine code entry
  const handleMachineCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = machineCode.trim().toUpperCase();

    if (!code) {
      setError("Please enter a machine code");
      return;
    }

    if (!isValidMachineCodeFormat(code)) {
      setError("Invalid machine code format. Machine codes look like M01, M02, etc.");
      return;
    }

    setValidatingCode(true);
    setError(null);

    try {
      const result = await getMachineById(code);

      if (result.success && result.machine) {
        setMachine(result.machine);
        setValidatingCode(false);

        // Redirect to menu page
        setTimeout(() => {
          router.push(`/${result.machine!.id}`);
        }, 1000);
      } else {
        setValidatingCode(false);
        setError(
          result.message || `Machine ${code} not found or is unavailable. Please check the code and try again.`
        );
      }
    } catch (err: any) {
      setValidatingCode(false);
      setError("Failed to validate machine code. Please try again.");
    }
  };

  return (
    <>
      <div className="w-full fixed top-0 z-10">
        <Navbar />
      </div>

      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full md:w-1/2 lg:w-1/3 p-6 mt-16">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* QR Code Validation State */}
            {mt && loading && (
              <div className="text-center">
                <PulseLoader color="#3B82F6" size={15} />
                <p className="mt-4 text-gray-600">Validating QR code...</p>
              </div>
            )}

            {/* QR Code Success State */}
            {mt && machine && !loading && (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <svg
                    className="w-16 h-16 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Machine Found!
                </h2>
                <p className="text-gray-600 mb-1">
                  <span className="font-medium">{machine.id}</span>
                </p>
                {machine.location && (
                  <p className="text-sm text-gray-500 mb-4">{machine.location}</p>
                )}
                <p className="text-sm text-gray-500">Redirecting to menu...</p>
              </div>
            )}

            {/* QR Code Error State */}
            {mt && error && !loading && (
              <div>
                <div className="flex justify-center mb-4">
                  <svg
                    className="w-16 h-16 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3 text-center">
                  QR Code Invalid
                </h2>
                <p className="text-red-600 text-sm mb-6 text-center">{error}</p>

                {/* Fallback to manual entry */}
                <div className="border-t pt-6">
                  <p className="text-sm text-gray-600 mb-4 text-center">
                    Enter a machine code manually:
                  </p>
                  <ManualEntryForm
                    machineCode={machineCode}
                    setMachineCode={setMachineCode}
                    validatingCode={validatingCode}
                    onSubmit={handleMachineCodeSubmit}
                  />
                </div>
              </div>
            )}

            {/* Manual Entry State (no QR code) */}
            {!mt && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                  Welcome to GolBot
                </h2>
                <p className="text-gray-600 mb-6 text-center">
                  Scan the QR code on a machine or enter the machine code below
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {machine && !validatingCode && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                    <p className="text-green-700 text-sm text-center">
                      Redirecting to {machine.id}...
                    </p>
                  </div>
                )}

                <ManualEntryForm
                  machineCode={machineCode}
                  setMachineCode={setMachineCode}
                  validatingCode={validatingCode}
                  onSubmit={handleMachineCodeSubmit}
                />

                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500">
                    Machine codes look like: <span className="font-mono font-semibold">M01</span>, <span className="font-mono font-semibold">M02</span>, etc.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Manual Entry Form Component
function ManualEntryForm({
  machineCode,
  setMachineCode,
  validatingCode,
  onSubmit,
}: {
  machineCode: string;
  setMachineCode: (code: string) => void;
  validatingCode: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="machineCode" className="block text-sm font-medium text-gray-700 mb-2">
          Machine Code
        </label>
        <input
          type="text"
          id="machineCode"
          value={machineCode}
          onChange={(e) => setMachineCode(e.target.value.toUpperCase())}
          placeholder="e.g., M01"
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono"
          disabled={validatingCode}
          autoComplete="off"
          maxLength={5}
        />
      </div>

      <button
        type="submit"
        disabled={validatingCode}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-md transition-colors"
      >
        {validatingCode ? (
          <PulseLoader color="#fff" size={10} cssOverride={{ margin: "0px" }} />
        ) : (
          "Continue to Menu"
        )}
      </button>
    </form>
  );
}
