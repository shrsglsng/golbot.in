import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { isAuthenticated, clearAuth } from "@/utils/auth";
import { Toaster } from "sonner";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // Skip authentication check for login page
    if (router.pathname === "/auth/login") {
      return;
    }

    // Check if user is authenticated with valid token
    if (!isAuthenticated()) {
      console.log("Authentication failed - redirecting to login");
      clearAuth(); // Clean up invalid token
      router.replace("/auth/login");
    }
  }, [router.pathname]);

  return (
    <>
      <Component {...pageProps} />
      <Toaster position="top-right" richColors />
    </>
  );
}
