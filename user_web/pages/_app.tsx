import "../styles/globals.css"
import type { AppProps } from "next/app"
import { wrapper } from "../redux/store"
import { Provider } from "react-redux"
import { Toaster } from "@/components/ui/toaster"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

function App({ Component, ...rest }: AppProps) {
  const { store, props } = wrapper.useWrappedStore(rest);
  const router = useRouter();
  const [isHomePage, setIsHomePage] = useState(true);

  useEffect(() => {
    // Check if current page is home page
    setIsHomePage(router.pathname === "/");
  }, [router.pathname]);

  return (
    <Provider store={store}>
      <div
        className={isHomePage ? "" : "min-h-screen bg-cover bg-center bg-fixed bg-no-repeat"}
        style={!isHomePage ? { backgroundImage: "url('/golbot4.png')" } : {}}
      >
        <Component {...props.pageProps} />
        <Toaster position="top-right" richColors />
      </div>
    </Provider>
  )
}

export default App
