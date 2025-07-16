import Link from "next/link"
import Logo from "./logo"
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner"
import LogoutIcon from "@mui/icons-material/Logout"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/router"
import { useDispatch } from "react-redux"
import { selectOrder, updateOrder } from "../redux/orderSlice"
import { useSelector } from "react-redux"
import { getIsOrderCompleted, getLatestOrder } from "../services/order"
import CloseIcon from "@mui/icons-material/Close"
import MenuIcon from "@mui/icons-material/Menu"
import LoginIcon from "@mui/icons-material/Login"
import LoadingBar, { LoadingBarRef } from "react-top-loading-bar"
import { updateToken } from "../redux/userSlice"
import { UserModel } from "../models/userModel"

function Navbar() {
  const [loggedIn, setLoggedIn] = useState(true)
  const [showDrawer, setShowDrawer] = useState<boolean>(false)
  const [showQrBtn, setShowQrBtn] = useState(false)

  const router = useRouter()
  const order = useSelector(selectOrder)
  const dispatch = useDispatch()
  const pageLoadingRef = useRef<LoadingBarRef>(null)

  // handle auth
  async function checkUser(): Promise<UserModel | undefined> {
    if (localStorage.getItem("Token") != null) {
      const token: string | undefined = localStorage
        .getItem("Token")
        ?.toString()
      return { token: token || "" }
    }
  }

  useEffect(() => {
    async function callAsyncc() {
      const user = await checkUser()
      dispatch(updateToken({ token: user?.token }))

      // get latest order
      if (user?.token) dispatch(updateOrder({ order: await getLatestOrder() }))
    }
    callAsyncc()
  }, [])

  // handle page loading bar

  useEffect(() => {
    const handleStart = (url: any) => {
      if (pageLoadingRef.current != null) {
        url !== router.asPath && pageLoadingRef.current.continuousStart()
      }
    }
    const handleComplete = (url: any) => {
      if (pageLoadingRef.current != null) {
        url === router.asPath && pageLoadingRef.current.complete()
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
  })

  useEffect(() => {
    ;(async () => {
      // console.log(!(await getIsOrderCompleted()));
      if (router.query.mid && router.asPath !== `/${router.query.mid}`) {
        setShowQrBtn(!(await getIsOrderCompleted({ router: router })))
      }
    })()

    setLoggedIn(!!localStorage.getItem("Token"))
  }, [])
  // useEffect(() => {
  //   if (order && (order.ostatus === "READY")) {
  //     setShowQrBtn(true);
  //   }
  // }, [router]);
  // console.log(router.asPath)
  // console.log(router.pathname)

  return (
    <>
      <div className="h-[72px] p-3 w-screen flex border border-b bg-cblue">
        <div
          className="flex-1 basis-0 h-full w-full"
          onClick={() => {
            router.push(`/${router.query.mid ?? "/"}`)
          }}>
          <div className="relative w-28 h-full">
            <Logo />
          </div>
        </div>

        {/* <div
          className="flex-1 basis-0 h-full w-full flex"
          style={{ justifyContent: "right", alignItems: "center" }}>
          <button
            onClick={() => router.push(`/${router.query.mid}/qrPage`)}
            className={`p-3 bg-cblue rounded-full text-white ${
              !showQrBtn && router.pathname === "/" && "hidden"
            }`}
            style={{ marginRight: "16px" }}>
            <QrCodeScannerIcon />
          </button>
        </div> */}

        <div
          className="flex-1 basis-0 h-full w-full flex"
          style={{ justifyContent: "right", alignItems: "center" }}>
          <button
            className="flex h-full w-full -mr-6 justify-center items-center"
            onClick={() => {
              setShowDrawer(true)
            }}>
            <div className="p-3">
              <MenuIcon className="text-white" fontSize="large" />
            </div>
            <div className="text-lg text-white">{/* Logout */}</div>
          </button>
        </div>
      </div>
      {/* Drawer for mobile view only*/}
      <div
        className={
          "fixed top-0 right-0 h-screen w-screen backdrop-blur-sm z-30 transition duration-300 ease-in-out " +
          (showDrawer ? "translate-x-0" : "translate-x-[100vw]")
        }>
        <div className="h-full w-4/5 md:w-1/2 lg:w-1/2 absolute top-0 right-0 bg-slate-100 rounded-l-2xl p-10">
          <div className="flex flex-col h-full justify-around items-center">
            {/* <div className="h-10" /> */}
            <button className="self-end" onClick={() => setShowDrawer(false)}>
              <CloseIcon className="text-cblued" fontSize="large" />
            </button>
            <Link href="about-us">About Us</Link>
            <Link href="terms">Terms And Conditions</Link>
            <Link href="privacy-policy">Privacy Policy</Link>
            <Link href="refund-policy">Refund Policy</Link>
            <Link href="shipping">Shipping Policy</Link>
            <Link href="contact">Contact Us</Link>
            <div className="h-16" />

            {loggedIn ? (
              <button
                className="text-cblued"
                onClick={() => {
                  localStorage.removeItem("Token")
                  dispatch(updateOrder({ order: {} }))
                  router.replace({
                    pathname: "/",
                  })
                }}>
                <LogoutIcon className="text-cblued mr-4" />
                Logout
              </button>
            ) : (
              <button
                className="text-cblued text-lg"
                onClick={() => {
                  router.replace({
                    pathname: "/auth/login",
                    query: { next: router.query.mid?.toString() ?? "" },
                  })
                }}>
                <LoginIcon className="text-cblued mr-4" />
                Login
              </button>
            )}
          </div>
        </div>
      </div>
      <LoadingBar color="#f11946" ref={pageLoadingRef} height={4} />
    </>
  )
}

export default Navbar
