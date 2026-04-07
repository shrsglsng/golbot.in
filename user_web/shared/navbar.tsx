import Link from "next/link"
import Logo from "./logo"
import {
  QrCode, LogOut, LogIn, Menu, Package, RefreshCw,
  User, FileText, Shield,
  Mail, Truck, RotateCcw, ChevronRight, Info
} from "lucide-react"
import LoadingBar, { LoadingBarRef } from "react-top-loading-bar"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/router"
import { useDispatch } from "react-redux"
import { updateToken } from "../redux/userSlice"
import { updateOrder } from "../redux/orderSlice"
import { getLatestOrder, getIsOrderCompleted } from "../services/order"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getSavedMachineId } from "../utils/machineStorage"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showQrBtn, setShowQrBtn] = useState(false)
  const [savedMachineId, setSavedMachineId] = useState<string | null>(null)

  const router = useRouter()
  const dispatch = useDispatch()
  const pageLoadingRef = useRef<LoadingBarRef>(null)

  useEffect(() => {
    async function init() {
      // Load saved machine ID
      const saved = getSavedMachineId()
      setSavedMachineId(saved)

      const token = localStorage.getItem("Token")
      if (token) {
        dispatch(updateToken({ token }))
        try{
          const latestOrder = await getLatestOrder();
          dispatch(updateOrder({ order: latestOrder }))
          setLoggedIn(true);
        } catch (error:any){
          if(error.message === "AUTHENCTICATION_REQUIRED"){
            localStorage.removeItem("Token");
            setLoggedIn(false);
            router.push('/login');
            return
          }
          console.error("Failed to fetch latest order: ", error)
          setLoggedIn(false);
          return;
        }

        // Only check order completion if user is logged in and not on main page
        if (router.query.mid && router.asPath !== `/${router.query.mid}`) {
          try {
            const isCompleted = await getIsOrderCompleted({ router })
            setShowQrBtn(!isCompleted)
          } catch (error: any) {
            // If there's an authentication error, ignore it silently
            // This prevents unnecessary error logs when token is invalid
            console.log("Order completion check skipped - authentication required")
            setShowQrBtn(false)
          }
        }
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

  return (
    <>
      {/* Top navbar */}
      <nav className="h-[72px] w-full px-4 flex items-center justify-between bg-primary shadow-lg fixed top-0 z-30 backdrop-blur-sm">
        <Button
          variant="ghost"
          className="h-12 px-2 hover:bg-primary-light focus-visible:ring-white"
          onClick={() => router.push("/")}
          aria-label="Go to home"
        >
          <div className="relative w-28 h-12">
            <Logo />
          </div>
        </Button>

        <div className="flex items-center gap-2">
          {showQrBtn && (
            <Button
              onClick={() => router.push(`/${router.query.mid}/qrPage`)}
              variant="secondary"
              size="icon"
              className="rounded-full shadow-md hover:shadow-lg transition-shadow"
              title="Scan QR"
            >
              <QrCode className="h-5 w-5" />
            </Button>
          )}
          <Button
            onClick={() => setShowDrawer(true)}
            variant="ghost"
            size="icon"
            className="hover:bg-primary-light text-white"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </nav>

      {/* Shadcn Sheet Drawer - Zomato/Swiggy Style */}
      <Sheet open={showDrawer} onOpenChange={setShowDrawer}>
        <SheetContent side="right" className="w-[85vw] sm:w-[400px] p-0 flex flex-col">
          {/* Profile Section */}
          <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 p-6 pb-8">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
                <AvatarFallback className="bg-white text-orange-600 text-xl font-bold">
                  {loggedIn ? <User className="h-8 w-8" /> : <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                {loggedIn ? (
                  <>
                    <h3 className="text-white font-semibold text-lg">Welcome Back!</h3>
                    <p className="text-white/90 text-sm">GolBot User</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-white font-semibold text-lg">Hello Guest</h3>
                    <p className="text-white/90 text-sm">Login for better experience</p>
                  </>
                )}
              </div>
            </div>

            {savedMachineId && (
              <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <p className="text-white/80 text-xs">Current Machine</p>
                <p className="text-white font-mono font-semibold">{savedMachineId}</p>
              </div>
            )}
          </div>

          {/* Menu Content */}
          <div className="flex-1 overflow-y-auto py-2">
            {/* Quick Actions */}
            {(loggedIn || savedMachineId) && (
              <div className="px-4 py-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                  Quick Actions
                </h4>
                <div className="space-y-1">
                  {loggedIn && (
                    <Link
                      href="/myOrders"
                      onClick={() => setShowDrawer(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-orange-50 transition-colors group"
                    >
                      <div className="p-2 rounded-full bg-orange-100 group-hover:bg-orange-200 transition-colors">
                        <Package className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">My Orders</p>
                        <p className="text-xs text-muted-foreground">Track your orders</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  )}

                  {savedMachineId && (
                    <Link
                      href="/order"
                      onClick={() => setShowDrawer(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-orange-50 transition-colors group"
                    >
                      <div className="p-2 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                        <RefreshCw className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Change Machine</p>
                        <p className="text-xs text-muted-foreground">Switch to another machine</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {(loggedIn || savedMachineId) && <Separator className="my-4" />}

            {/* Information */}
            <div className="px-4 py-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                Information
              </h4>
              <div className="space-y-1">
                <Link
                  href="/about-us"
                  onClick={() => setShowDrawer(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">About Us</span>
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setShowDrawer(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">Contact Us</span>
                </Link>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Policies */}
            <div className="px-4 py-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                Policies
              </h4>
              <div className="space-y-1">
                <Link
                  href="/terms"
                  onClick={() => setShowDrawer(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground text-sm">Terms & Conditions</span>
                </Link>
                <Link
                  href="/privacy-policy"
                  onClick={() => setShowDrawer(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground text-sm">Privacy Policy</span>
                </Link>
                <Link
                  href="/refund-policy"
                  onClick={() => setShowDrawer(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground text-sm">Refund Policy</span>
                </Link>
                <Link
                  href="/shipping"
                  onClick={() => setShowDrawer(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground text-sm">Shipping Policy</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Auth Section - Footer */}
          <div className="p-4 border-t bg-muted/30">
            {loggedIn ? (
              <Button
                onClick={() => {
                  localStorage.removeItem("Token")
                  dispatch(updateOrder({ order: {} }))
                  setLoggedIn(false)
                  setShowDrawer(false)
                  router.replace("/")
                }}
                variant="destructive"
                className="w-full justify-center gap-2 shadow-sm"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setShowDrawer(false)
                  router.replace({
                    pathname: "/auth/login",
                    query: { next: router.query.mid?.toString() ?? "" },
                  })
                }}
                className="w-full justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-sm"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <LoadingBar color="#FF9800" ref={pageLoadingRef} height={3} />
    </>
  )
}

export default Navbar
