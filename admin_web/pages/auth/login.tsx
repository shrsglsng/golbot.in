import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import axios from "axios";
import validator from "validator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Mail, Lock, Bot, ChefHat } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrors({ email: "", password: "" });
    setIsLoading(true);

    // Validation
    if (!validator.isEmail(credentials.email)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }));
      setIsLoading(false);
      return;
    }

    if (credentials.password.length === 0) {
      setErrors((prev) => ({ ...prev, password: "Password is required" }));
      setIsLoading(false);
      return;
    }

    if (credentials.password.length < 6) {
      setErrors((prev) => ({ ...prev, password: "Password must be at least 6 characters" }));
      setIsLoading(false);
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
      if (!baseUrl) throw new Error("Server URL not set");

      const res = await axios.post(`${baseUrl}/admin/login`, {
        email: credentials.email,
        password: credentials.password,
      });

      if (res.status === 200 && res.data.data.token) {
        localStorage.setItem("Token", res.data.data.token);

        if (rememberMe) {
          localStorage.setItem("rememberedEmail", credentials.email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        toast.success("Login successful! Welcome back.");

        // Small delay for better UX
        setTimeout(() => {
          router.replace("/");
        }, 500);
        return;
      }
    } catch (error: any) {
      console.error("Login failed:", error);

      if (error.response?.status === 401) {
        toast.error("Invalid email or password");
        setErrors({
          email: "Invalid credentials",
          password: " ",
        });
      } else if (error.response?.status === 403) {
        toast.error("Account is disabled. Please contact support.");
      } else {
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Admin Login - GolBot</title>
        <meta name="description" content="GolBot Admin Login" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4">
        {/* Animated gradient background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200/40 to-red-200/40 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-200/40 to-yellow-200/40 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <Card className="w-full max-w-md relative shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-6">
            {/* Logo/Brand */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur-lg opacity-50" />
                <div className="relative bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-2xl">
                  <Bot className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                GolBot Admin
              </CardTitle>
              <CardDescription className="text-base">
                Sign in to manage your vending machines
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@golbot.in"
                    value={credentials.email}
                    onChange={(e) => {
                      setCredentials((prev) => ({ ...prev, email: e.target.value }));
                      setErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    className={`pl-10 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(e) => {
                      setCredentials((prev) => ({ ...prev, password: e.target.value }));
                      setErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    className={`pl-10 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
                {errors.password && errors.password.trim() && (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Remember me
                </label>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Powered by</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <ChefHat className="h-4 w-4 text-orange-500" />
                  <span className="font-semibold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    GolBot
                  </span>
                  <span>- Automated Vending Solutions</span>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 border-4 border-orange-200 rounded-full animate-bounce opacity-20" />
        <div className="absolute bottom-10 right-10 w-16 h-16 border-4 border-red-200 rounded-full animate-bounce delay-500 opacity-20" />
      </main>
    </>
  );
}
