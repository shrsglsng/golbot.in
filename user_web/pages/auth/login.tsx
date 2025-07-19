import Head from "next/head"
import { useEffect, useState } from "react"
import { sendOtp, verifyOtp } from "../../services/auth"
import { useRouter } from "next/router"
import { useDispatch } from "react-redux"
import { PulseLoader } from "react-spinners"
import Logo from "../../shared/logo"
import { updateOrder } from "../../redux/orderSlice"
import { getLatestOrder } from "../../services/order"

const INIT_STATE = { phone: "", OTP: "" }

export default function Login() {
  const router = useRouter()
  const dispatch = useDispatch()

  const [otpSent, setOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fieldData, setFieldData] = useState(INIT_STATE)
  const [errField, setErrField] = useState(INIT_STATE)

  useEffect(() => {
    if (localStorage.getItem("Token") != null)
      router.replace(router.query.next?.toString() ?? "/")
  }, [])

  const handleBtnOnClick = async () => {
    setIsLoading(true)
    setErrField(INIT_STATE)

    if (fieldData.phone.length !== 10) {
      setErrField((f) => ({ ...f, phone: "Invalid Phone Number" }))
      setIsLoading(false)
      return
    }

    if (!otpSent) {
      if (await sendOtp(fieldData.phone)) setOtpSent(true)
    } else {
      if (fieldData.OTP.length !== 6) {
        setErrField((f) => ({ ...f, OTP: "Enter 6-digit OTP" }))
        setIsLoading(false)
        return
      }

      const user = await verifyOtp(fieldData.phone, fieldData.OTP, dispatch)
      if (!user) {
        setErrField((f) => ({ ...f, OTP: "Invalid OTP" }))
        setIsLoading(false)
        return
      }

      router.replace(`/${router.query.next ?? ""}`)
      dispatch(updateOrder({ order: await getLatestOrder() }))
    }

    setIsLoading(false)
  }

  let buttonText;
  if (isLoading) {
    buttonText = <PulseLoader size={8} />;
  } else if (otpSent) {
    buttonText = "Login";
  } else {
    buttonText = "Send OTP";
  }

  return (
    <>
      <Head>
        <title>Login</title>
        <meta name="description" content="OTP login" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="w-screen h-screen flex flex-col">
        {/* Top bar with logo */}
        <div className="h-20 p-3 w-screen flex bg-cblue border border-b">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex-1 basis-0 h-full w-full text-left focus:outline-none"
          >
            <div className="relative w-28 h-full">
              <Logo />
            </div>
          </button>
        </div>

        {/* Login Form */}
        <div className="w-full h-full grid place-items-center">
          <div className="w-80 flex flex-col p-5 border-t-4 border-t-cblue border border-gray-400 rounded-lg">
            <div className="text-3xl text-center">Login</div>

            <div className="h-8" />

            {/* Phone input */}
            <div className="flex items-center">
              <div className="ml-1 p-2 border rounded-lg">+91</div>
              <div className="w-3" />
              <input
                disabled={otpSent}
                className={`p-2 px-5 w-full border rounded-lg focus:border-cblue focus:border-2 ${
                  otpSent ? "text-gray-500 bg-gray-100" : ""
                } ${errField.phone && "border-red-500 focus:border-red-500"}`}
                type="text"
                value={fieldData.phone}
                onChange={(v) =>
                  setFieldData((f) => ({
                    ...f,
                    phone: v.target.value.replace(/\D/g, "").slice(0, 10),
                  }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleBtnOnClick()}
                autoFocus
                placeholder="Enter Phone Number"
              />
            </div>
            <div className="h-8 text-red-500 text-sm ml-2 mt-1">
              {errField.phone}
            </div>

            {/* OTP input */}
            {otpSent && (
              <>
                <div className="flex items-center">
                  <div className="ml-1">Enter OTP :</div>
                  <div className="w-4" />
                  <input
                    className={`w-44 p-2 px-5 border rounded-lg focus:border-cblue focus:border-2 ${
                      errField.OTP && "border-red-500 focus:border-red-500"
                    }`}
                    type="text"
                    value={fieldData.OTP}
                    onChange={(v) =>
                      setFieldData((f) => ({
                        ...f,
                        OTP: v.target.value.replace(/\D/g, "").slice(0, 6),
                      }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleBtnOnClick()}
                    placeholder="6-digit OTP"
                  />
                </div>
                <div className="h-8 text-red-500 text-sm ml-2 mt-1">
                  {errField.OTP}
                </div>

                {/* Resend OTP */}
                <button
                  type="button"
                  className="text-sm text-cblue ml-1 mt-2 underline hover:text-blue-800 focus:outline-none"
                  onClick={async () => {
                    setIsLoading(true)
                    await sendOtp(fieldData.phone)
                    setIsLoading(false)
                  }}
                >
                  Resend OTP
                </button>
              </>
            )}

            {/* Submit button */}
            <button
              type="button"
              className="p-2 text-white border border-cblue bg-cblue rounded-md hover:border hover:border-cblue hover:text-cblue hover:bg-white mt-3"
              onClick={handleBtnOnClick}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
