import Head from "next/head"
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../shared/navbar";
import { resolveMachineFromToken, getMachineById, isValidMachineCodeFormat, MachineInfo } from "../services/machine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { CheckCircle2, XCircle, Loader2, QrCode, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getSavedMachineId } from "../utils/machineStorage";

export default function OrderPage() {
  const router = useRouter();
  const { mt } = router.query;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [machine, setMachine] = useState<MachineInfo | null>(null);
  const [machineCode, setMachineCode] = useState("");
  const [validatingCode, setValidatingCode] = useState(false);
  const [savedMachineId, setSavedMachineId] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Check for saved machine ID on mount
  useEffect(() => {
    const saved = getSavedMachineId();
    if (saved) {
      setSavedMachineId(saved);
    } else {
      setShowManualEntry(true); // Show manual entry if no saved machine
    }
  }, []);

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
        toast.success("Machine found!", `Redirecting to ${result.machine.id}...`);

        // Auto-redirect to menu page after successful validation
        setTimeout(() => {
          router.push(`/${result.machine!.id}`);
        }, 1500);
      } else {
        setLoading(false);
        const errorMsg = result.message || "This QR code is invalid or has been deactivated.";
        setError(errorMsg);
        toast.error("QR Code Invalid", errorMsg);
      }
    } catch (err: any) {
      setLoading(false);
      const errorMsg = "Failed to validate QR code. Please try again.";
      setError(errorMsg);
      toast.error("Validation Failed", errorMsg);
    }
  };

  // Handle manual machine code entry
  const handleMachineCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = machineCode.trim().toUpperCase();

    if (!code) {
      toast.error("Error", "Please enter a machine code");
      return;
    }

    if (!isValidMachineCodeFormat(code)) {
      toast.error("Invalid Format", "Machine code must be 3-20 alphanumeric characters (e.g., M01, M02, ABC123)");
      return;
    }

    setValidatingCode(true);
    setError(null);

    try {
      const result = await getMachineById(code);

      if (result.success && result.machine) {
        setMachine(result.machine);
        setValidatingCode(false);
        toast.success("Machine found!", `Redirecting to ${result.machine.id}...`);

        // Redirect to menu page
        setTimeout(() => {
          router.push(`/${result.machine!.id}`);
        }, 1000);
      } else {
        setValidatingCode(false);
        const errorMsg = result.message || `Machine ${code} not found or is unavailable.`;
        setError(errorMsg);
        toast.error("Not Found", errorMsg);
      }
    } catch (err: any) {
      setValidatingCode(false);
      const errorMsg = "Failed to validate machine code. Please try again.";
      setError(errorMsg);
      toast.error("Validation Failed", errorMsg);
    }
  };

  return (
    <>
      <Head>
        <title>Start Order - GolBot</title>
        <meta name="description" content="Start your order by scanning QR or entering machine code" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Navbar />

        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-primary to-primary-dark text-white py-16 mt-[72px]">
          <Container size="lg">
            <div className="text-center space-y-3 animate-fade-in">
              <h1 className="text-3xl md:text-4xl font-bold">
                Start Your Order
              </h1>
              <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto">
                Scan the QR code on your vending machine or enter the machine code below
              </p>
            </div>
          </Container>
        </div>

        <Container size="sm" className="py-16">
          <Card className="shadow-2xl animate-fade-in border-none">
            <CardContent className="p-8 md:p-12">
              {/* QR Code Validation State */}
              {mt && loading && (
                <Stack spacing="lg" align="center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                  <Stack spacing="sm" align="center">
                    <h2 className="text-xl font-semibold">Validating QR Code</h2>
                    <p className="text-muted-foreground text-sm">Please wait...</p>
                  </Stack>
                </Stack>
              )}

              {/* QR Code Success State */}
              {mt && machine && !loading && (
                <Stack spacing="lg" align="center">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center animate-fade-in">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <Stack spacing="sm" align="center">
                    <h2 className="text-xl font-semibold">Machine Found!</h2>
                    <p className="text-lg font-medium text-primary">{machine.id}</p>
                    {machine.location && (
                      <p className="text-sm text-muted-foreground">{machine.location}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Redirecting to menu...</p>
                  </Stack>
                </Stack>
              )}

              {/* QR Code Error State */}
              {mt && error && !loading && (
                <Stack spacing="lg">
                  <Stack spacing="lg" align="center">
                    <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                      <XCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <Stack spacing="sm" align="center">
                      <h2 className="text-xl font-semibold">QR Code Invalid</h2>
                      <p className="text-sm text-muted-foreground text-center max-w-md">
                        {error}
                      </p>
                    </Stack>
                  </Stack>

                  <div className="border-t pt-6">
                    <p className="text-sm text-muted-foreground mb-4 text-center">
                      Enter a machine code manually:
                    </p>
                    <ManualEntryForm
                      machineCode={machineCode}
                      setMachineCode={setMachineCode}
                      validatingCode={validatingCode}
                      onSubmit={handleMachineCodeSubmit}
                    />
                  </div>
                </Stack>
              )}

              {/* Manual Entry State (no QR code) */}
              {!mt && (
                <div className="space-y-8">
                  {/* Show saved machine option if available */}
                  {savedMachineId && !showManualEntry && (
                    <div className="space-y-6">
                      <div className="text-center space-y-3">
                        <div className="inline-flex h-16 w-16 rounded-2xl bg-primary/10 items-center justify-center mx-auto">
                          <QrCode className="h-7 w-7 text-primary" strokeWidth={2} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold mb-1.5">Continue to</h2>
                          <p className="text-3xl font-bold text-primary font-mono">{savedMachineId}</p>
                        </div>
                      </div>

                      <Button
                        onClick={() => router.push(`/${savedMachineId}`)}
                        size="lg"
                        className="w-full h-14 text-base font-semibold group"
                      >
                        Continue to Menu
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => setShowManualEntry(true)}
                        variant="outline"
                        size="lg"
                        className="w-full h-12"
                      >
                        Use Different Machine
                      </Button>
                    </div>
                  )}

                  {/* Manual entry form */}
                  {(!savedMachineId || showManualEntry) && (
                    <>
                      <div className="text-center space-y-3">
                        <div className="inline-flex h-16 w-16 rounded-2xl bg-primary/5 items-center justify-center mx-auto backdrop-blur-sm">
                          <QrCode className="h-7 w-7 text-primary/70" strokeWidth={1.5} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold mb-1.5 text-foreground/90">
                            {savedMachineId ? "Enter New Machine Code" : "Enter Machine Code"}
                          </h2>
                          <p className="text-sm text-muted-foreground/80">
                            Find the code displayed on your vending machine
                          </p>
                        </div>
                      </div>

                      <ManualEntryForm
                        machineCode={machineCode}
                        setMachineCode={setMachineCode}
                        validatingCode={validatingCode}
                        onSubmit={handleMachineCodeSubmit}
                      />

                      {savedMachineId && (
                        <Button
                          onClick={() => setShowManualEntry(false)}
                          variant="ghost"
                          className="w-full"
                        >
                          ← Back to Saved Machine
                        </Button>
                      )}

                      <div className="pt-4 space-y-3">
                        <div className="text-center">
                          <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-3">
                            Example Codes
                          </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                          <div className="px-4 py-2 bg-muted/40 rounded-lg border border-border/50">
                            <code className="font-mono text-sm font-medium text-muted-foreground">M01</code>
                          </div>
                          <div className="px-4 py-2 bg-muted/40 rounded-lg border border-border/50">
                            <code className="font-mono text-sm font-medium text-muted-foreground">M02</code>
                          </div>
                          <div className="px-4 py-2 bg-muted/40 rounded-lg border border-border/50">
                            <code className="font-mono text-sm font-medium text-muted-foreground">M03</code>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </Container>
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
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <div className="relative group">
          <Input
            type="text"
            id="machineCode"
            value={machineCode}
            onChange={(e) => setMachineCode(e.target.value.toUpperCase())}
            placeholder="M01"
            className="h-14 text-center text-xl font-mono font-semibold tracking-[0.3em] uppercase
                     bg-background/50 backdrop-blur-sm
                     border-muted-foreground/20
                     focus:border-primary/40 focus:ring-4 focus:ring-primary/10
                     transition-all duration-300 ease-in-out
                     placeholder:text-muted-foreground/30 placeholder:tracking-[0.3em]
                     hover:border-muted-foreground/30"
            disabled={validatingCode}
            autoComplete="off"
            maxLength={20}
            minLength={3}
            autoFocus
          />
          {machineCode && !validatingCode && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-fade-in">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={validatingCode || !machineCode}
        loading={validatingCode}
        className="w-full h-12 text-base font-medium
                 bg-primary hover:bg-primary/90
                 shadow-sm hover:shadow-md
                 transition-all duration-300 ease-in-out
                 disabled:opacity-50"
        size="lg"
      >
        {validatingCode ? "Validating..." : "Continue"}
      </Button>
    </form>
  );
}
