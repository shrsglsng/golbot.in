import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect } from "react";

// TODO: write a function to check if auth token is expired or not
export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  useEffect(() => {
    if (localStorage.getItem("Token") == null) {
      router.replace("/auth/login");
    }
  }, []);
  return <Component {...pageProps} />;
}
