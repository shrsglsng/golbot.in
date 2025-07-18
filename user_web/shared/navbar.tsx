import Link from "next/link"
import Logo from "./logo"
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner"
import LogoutIcon from "@mui/icons-material/Logout"
import LoginIcon from "@mui/icons-material/Login"
import CloseIcon from "@mui/icons-material/Close"
import MenuIcon from "@mui/icons-material/Menu"
import LoadingBar, { LoadingBarRef } from "react-top-loading-bar"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/router"
import { useDispatch } from "react-redux"
import { updateToken } from "../redux/userSlice"
import { updateOrder } from "../redux/orderSlice"
import { getLatestOrder, getIsOrderCompleted } from "../services/order"

function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showQrBtn, setShowQrBtn] = useState(false)

  const router = useRouter()
  const dispatch = useDispatch()
  const pageLoadingRef = useRef<LoadingBarRef>(null)

  useEffect(() => {
    async function init() {
      const token = localStorage.getItem("Token")
      if (token) {
        dispatch(updateToken({ token }))
        dispatch(updateOrder({ order: await getLatestOrder() }))
        setLoggedIn(true)
      }

      if (router.query.mid && router.asPath !== `/${router.query.mid}`) {
        setShowQrBtn(!(await getIsOrderCompleted({ router })))
      }
    }
    init()
  }, [])

  useEffect(() => {
    const handleStart = (url: any) => {
      if (url !== router.asPath && pageLoadingRef.current) {
        pageLoadingRef.current.continuousStart()
      }
    }
    const handleComplete = (url: any) => {
      if (url === router.asPath && pageLoadingRef.current) {
        pageLoadingRef.current.complete()
      }
    }

    router.events.on("routeChangeStart", handleStart)
    router.events.on("routeChangeComplete", handleComplete)
    router.events.on("routeChangeError", handleComplete)

    return () => {
      router.events.off("routeChangeStart", handleStart)
      router.events.off("routeChangeComplete", handleComplete)
      router.events.off("routeChangeError", handleComplete)
    }
  }, [])

  const navLinks = [
    { label: "About Us", href: "about-us" },
    { label: "Terms & Conditions", href: "terms" },
    { label: "Privacy Policy", href: "privacy-policy" },
    { label: "Refund Policy", href: "refund-policy" },
    { label: "Shipping Policy", href: "shipping" },
    { label: "Contact Us", href: "contact" },
  ]

  return (
    <>
      {/* Top navbar */}
      <div className="h-[72px] w-full px-4 flex items-center justify-between bg-cblue shadow-md">
        <button
          type="button"
          className="cursor-pointer bg-transparent border-none p-0 m-0"
          onClick={() => router.push(`/${router.query.mid ?? "/"}`)}
          tabIndex={0}
          aria-label="Go to home"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              router.push(`/${router.query.mid ?? "/"}`);
            }
          }}
          style={{ outline: "none" }}
        >
          <div className="relative w-28 h-12">
            <Logo />
          </div>
        </button>

        <div className="flex items-center gap-4">
          {showQrBtn && (
            <button
              onClick={() => router.push(`/${router.query.mid}/qrPage`)}
              className="p-2 bg-white text-cblue rounded-full hover:shadow-md transition"
              title="Scan QR"
            >
              <QrCodeScannerIcon />
            </button>
          )}
          <button
            onClick={() => setShowDrawer(true)}
            className="p-2 rounded-md hover:bg-cblue/30 transition"
          >
            <MenuIcon className="text-white" fontSize="large" />
          </button>
        </div>
      </div>

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-40 h-screen w-screen bg-black/40 backdrop-blur-sm transition-transform duration-300 ${
          showDrawer ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="absolute right-0 top-0 h-full w-4/5 sm:w-2/3 md:w-1/2 bg-white rounded-l-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <span className="text-xl font-semibold text-cblue">Menu</span>
            <button onClick={() => setShowDrawer(false)}>
              <CloseIcon fontSize="large" className="text-cblue" />
            </button>
          </div>

          <div className="flex flex-col gap-5 text-lg text-gray-700">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={`/${link.href}`}
                className="hover:text-cblue transition"
                onClick={() => setShowDrawer(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-auto pt-8 border-t border-gray-300">
            {loggedIn ? (
              <button
                onClick={() => {
                  localStorage.removeItem("Token")
                  dispatch(updateOrder({ order: {} }))
                  router.replace("/")
                }}
                className="flex items-center text-cblue hover:text-red-600 transition"
              >
                <LogoutIcon className="mr-2" />
                Logout
              </button>
            ) : (
              <button
                onClick={() => {
                  router.replace({
                    pathname: "/auth/login",
                    query: { next: router.query.mid?.toString() ?? "" },
                  })
                }}
                className="flex items-center text-cblue hover:text-green-600 transition"
              >
                <LoginIcon className="mr-2" />
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      <LoadingBar color="#f11946" ref={pageLoadingRef} height={3} />
    </>
  )
}

export default Navbar
