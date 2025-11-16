import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bot, Shuffle, ArrowLeft, Check } from "lucide-react";
import MachineQRManager from "@/components/MachineQRManager";

export default function AddMachine() {
  const router = useRouter();
  const [mid, setMid] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [location, setLocation] = useState("");
  const [ipAddress, setIpAddress] = useState("0.0.0.0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [createdMachineId, setCreatedMachineId] = useState<string | null>(null);

  const generateRandomMid = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const firstChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789"; // Exclude 0 for first char

    // Generate 4-8 character MID
    const length = Math.floor(Math.random() * 5) + 4; // 4-8 chars
    let newMid = firstChars[Math.floor(Math.random() * firstChars.length)];
    for (let i = 1; i < length; i++) {
      newMid += chars[Math.floor(Math.random() * chars.length)];
    }

    setMid(newMid);
    toast.success("MID Generated", { description: `Generated MID: ${newMid}` });
  };

  const handleAddMachine = async () => {
    if (!mid || !password || !confirmPassword || !location) {
      toast.error("Missing Fields", { description: "Please fill all required fields" });
      return;
    }

    if (password.length < 6) {
      toast.error("Invalid Password", { description: "Password must be at least 6 characters" });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Password Mismatch", { description: "Passwords do not match" });
      return;
    }

    setIsSubmitting(true);

    try {
      if (!process.env.NEXT_PUBLIC_SERVER_URL) throw new Error("Server URL not set");
      const url = process.env.NEXT_PUBLIC_SERVER_URL + "/admin/machines";

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("Token")}`,
        },
        body: JSON.stringify({ mid, password, location, ipAddress }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create machine");

      setCreatedMachineId(mid);
      toast.success("Machine Created Successfully", {
        description: `Machine ${mid} has been created. You can now generate a QR code.`,
      });

      // Clear form
      setMid("");
      setPassword("");
      setConfirmPassword("");
      setLocation("");
      setIpAddress("0.0.0.0");
    } catch (err) {
      console.error("Failed to create machine:", err);
      const errorMsg = err instanceof Error ? err.message : "Something went wrong";
      toast.error("Failed to Create Machine", { description: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateQR = () => {
    if (createdMachineId) {
      setShowQRDialog(true);
    }
  };

  return (
    <>
      <Head>
        <title>Add Machine - GolBot Admin</title>
      </Head>

      <AppLayout title="Add Machine" description="Register a new vending machine">
        <div className="mx-auto max-w-2xl space-y-6">
          <Button variant="ghost" onClick={() => router.push("/viewMachines")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Machines
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Machine Information</CardTitle>
                  <CardDescription>
                    Enter the details for the new vending machine
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Machine ID */}
              <div className="space-y-2">
                <Label htmlFor="mid">Machine ID *</Label>
                <div className="flex gap-2">
                  <Input
                    id="mid"
                    placeholder="e.g., ABC123"
                    value={mid}
                    onChange={(e) => setMid(e.target.value.toUpperCase())}
                    maxLength={8}
                    disabled={isSubmitting}
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateRandomMid}
                    disabled={isSubmitting}
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  3-8 characters (A-Z, 0-9), first character cannot be 0
                </p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., Main Campus, Building A"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddMachine()}
                  disabled={isSubmitting}
                />
              </div>

              {/* Submit Button */}
              <Button
                className="w-full"
                onClick={handleAddMachine}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Machine..." : "Create Machine"}
              </Button>
            </CardContent>
          </Card>

          {/* Success Card */}
          {createdMachineId && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-green-900">Machine Created Successfully!</CardTitle>
                </div>
                <CardDescription className="text-green-700">
                  Machine <span className="font-mono font-bold">{createdMachineId}</span> has been
                  registered. You can now generate a QR code for this machine.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button onClick={handleGenerateQR} className="flex-1">
                  Generate QR Code
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/viewMachines")}
                  className="flex-1"
                >
                  View All Machines
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* QR Manager Dialog */}
        {createdMachineId && (
          <MachineQRManager
            open={showQRDialog}
            onClose={() => setShowQRDialog(false)}
            machineId={createdMachineId}
          />
        )}
      </AppLayout>
    </>
  );
}
