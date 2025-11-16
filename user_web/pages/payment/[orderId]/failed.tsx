import { useRouter } from "next/router"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function PaymentFailedRedirect() {
  const router = useRouter()
  const { orderId } = router.query

  useEffect(() => {
    if (!orderId) return

    // Try to get machine ID from sessionStorage (set during checkout)
    const pendingMachineId = sessionStorage.getItem('pendingMachineId')

    if (pendingMachineId) {
      // Redirect to the correct path with machine ID
      console.log(`Redirecting to /${pendingMachineId}/payment/${orderId}/failed`)
      router.replace(`/${pendingMachineId}/payment/${orderId}/failed`)
    } else {
      // Fallback: Try to get last used machine from localStorage
      const savedMid = localStorage.getItem('golbot_current_mid')

      if (savedMid) {
        console.log(`Using saved machine ID: ${savedMid}`)
        router.replace(`/${savedMid}/payment/${orderId}/failed`)
      } else {
        // No machine ID found, redirect to order page
        console.error('No machine ID found, redirecting to order page')
        router.replace('/order')
      }
    }
  }, [orderId, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}
