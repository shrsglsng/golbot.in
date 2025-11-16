import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import axios from "axios";
import validator from "validator";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserPlus, Mail, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Credentials {
  email: string;
  password: string;
  conPassword: string;
}

export default function AddAdmin() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credentials>({
    email: "",
    password: "",
    conPassword: "",
  });
  const [errors, setErrors] = useState<Credentials>({
    email: "",
    password: "",
    conPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Credentials = {
      email: "",
      password: "",
      conPassword: "",
    };

    let isValid = true;

    if (!validator.isEmail(credentials.email)) {
      newErrors.email = "Enter a valid email address";
      isValid = false;
    }

    if (credentials.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    if (credentials.password !== credentials.conPassword) {
      newErrors.conPassword = "Passwords don't match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    setErrors({
      email: "",
      password: "",
      conPassword: "",
    });

    if (!validateForm()) {
      toast.error("Validation Error", {
        description: "Please fix the errors in the form",
      });
      return;
    }

    setIsLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
      if (!baseUrl) {
        toast.error("Configuration Error", {
          description: "Server URL not set",
        });
        return;
      }

      const url = `${baseUrl}/admin/register`;

      const res = await axios.post(
        url,
        {
          email: credentials.email,
          password: credentials.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("Token")}`,
          },
        }
      );

      if (res.status === 201) {
        toast.success("Admin Added Successfully", {
          description: `${credentials.email} has been added as an admin`,
        });

        // Reset form
        setCredentials({
          email: "",
          password: "",
          conPassword: "",
        });

        // Navigate back to admins list after a short delay
        setTimeout(() => {
          router.push("/viewAdmins");
        }, 1500);
      }
    } catch (e: any) {
      console.error("Failed to add admin:", e);
      const errorMsg =
        e.response?.data?.message || e.response?.data?.msg || "Failed to add admin";
      toast.error("Failed to Add Admin", { description: errorMsg });
      setErrors((prev) => ({
        ...prev,
        email: errorMsg,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Add Admin - GolBot Admin</title>
      </Head>

      <AppLayout title="Add Admin" description="Create a new administrator account">
        <div className="space-y-6">
          {/* Back Button */}
          <div>
            <Button
              variant="outline"
              onClick={() => router.push("/viewAdmins")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admins
            </Button>
          </div>

          {/* Form Card */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Add New Administrator</CardTitle>
                  <CardDescription>
                    Create a new admin account with email and password
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={credentials.email}
                    onChange={(e) =>
                      setCredentials((prev) => ({ ...prev, email: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    disabled={isLoading}
                    className={`pl-9 ${errors.email ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials((prev) => ({ ...prev, password: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    disabled={isLoading}
                    className={`pl-9 ${errors.password ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="conPassword">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="conPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={credentials.conPassword}
                    onChange={(e) =>
                      setCredentials((prev) => ({
                        ...prev,
                        conPassword: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    disabled={isLoading}
                    className={`pl-9 ${errors.conPassword ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.conPassword && (
                  <p className="text-sm text-red-500">{errors.conPassword}</p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium mb-2">Password Requirements:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2
                      className={`h-4 w-4 ${
                        credentials.password.length >= 6
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    />
                    At least 6 characters long
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2
                      className={`h-4 w-4 ${
                        credentials.password === credentials.conPassword &&
                        credentials.password.length > 0
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    />
                    Passwords match
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/viewAdmins")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {isLoading ? "Adding Admin..." : "Add Admin"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </>
  );
}
