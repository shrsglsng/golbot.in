import Head from "next/head"
import { useState, useEffect } from "react"
import Image from "next/image"
import Camera, { FACING_MODES } from "react-html5-camera-photo"
import "react-html5-camera-photo/build/css/index.css"
import Navbar from "../../shared/navbar"
import { useRouter } from "next/router"
import { reportIssue, getOrderById } from "../../services/order"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Container } from "@/components/layout/Container"
import { Stack } from "@/components/layout/Stack"
import { RotateCcw, AlertCircle, Package, MapPin, Receipt, Loader2, CheckCircle2, Camera as CameraIcon } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

function ReportIssue() {
  const router = useRouter()
  const { mid, oid } = router.query
  const [order, setOrder] = useState<any>(null)
  const [isLoadingOrder, setIsLoadingOrder] = useState(false)
  const [img, setImage] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState<boolean>(false)
  const [descField, setDescField] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (oid && typeof oid === 'string') {
      const fetchOrder = async () => {
        setIsLoadingOrder(true)
        try {
          const data = await getOrderById(oid)
          if (data) {
            setOrder(data)
          }
        } catch (error) {
          console.error("Failed to fetch order details:", error)
          toast.error("Error", "Failed to load order details")
        } finally {
          setIsLoadingOrder(false)
        }
      }
      fetchOrder()
    }
  }, [oid])

  function handleTakePhoto(dataUri: any) {
    setImage(dataUri)
    setShowCamera(false)
  }

  async function url2File(url: string, fileName: string) {
    const blob = await (await fetch(url)).blob()
    return new File([blob], fileName, { type: blob.type })
  }

  async function handleSubmit() {
    if (!descField.trim()) {
      toast.error("Missing Description", "Please provide a description of the issue")
      return
    }

    try {
      setIsSubmitting(true)
      let data = new FormData()
      data.append("oid", oid as string)
      data.append("description", descField)
      data.append("machineId", mid as string)
      if (img) {
        data.append("image", await url2File(img, `report_${oid}.png`))
      }

      if (await reportIssue(data)) {
        toast.success("Report Submitted", "Issue reported successfully! We'll look into it soon.")
        setTimeout(() => {
          router.push(`/myOrders`)
        }, 2000)
      } else {
        toast.error("Submission Failed", "Failed to submit report. Please try again.")
      }
    } catch (error) {
      console.error("Submit report error:", error)
      toast.error("Error", "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const enableSubmit = descField.trim().length >= 10 && !isSubmitting

  return (
    <>
      <Head>
        <title>Report Issue - GolBot</title>
      </Head>

      <div className="min-h-screen bg-slate-50/50 pb-24">
        <Navbar />

        <Container size="md" className="pt-24 pb-12 px-4">
          <Stack spacing="xl">
            {/* Header */}
            <div className="flex flex-col items-center gap-3 text-center mb-4">
              <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">Report an Issue</h1>
              <p className="text-sm text-muted-foreground max-w-sm">
                Something went wrong with your order? Tell us what happened and we&apos;ll fix it.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Left Column: Order Details */}
              <div className="space-y-6 h-full">
                <Card className="shadow-sm border-slate-200 h-full">
                  <CardHeader className="bg-slate-50/50 pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-primary" />
                      Order Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {isLoadingOrder ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : order ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Order Number</p>
                            <p className="text-base font-bold">#{order.orderCounter}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Status</p>
                            <Badge variant="secondary" className="mt-0.5">{order.orderStatus}</Badge>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 p-1.5 rounded-md bg-slate-100">
                              <Package className="h-4 w-4 text-slate-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">Items Ordered</p>
                              <div className="text-sm font-medium mt-1">
                                {order.items?.map((item: any, idx: number) => (
                                  <div key={idx} className="flex justify-between py-1">
                                    <span>{item.name}</span>
                                    <span className="text-muted-foreground">×{item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="mt-1 p-1.5 rounded-md bg-slate-100">
                              <MapPin className="h-4 w-4 text-slate-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">Machine & Location</p>
                              <p className="text-sm font-medium mt-1">{order.machineId}</p>
                              <p className="text-xs text-muted-foreground">{order.machineLocation}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-primary/5 rounded-xl p-4 flex justify-between items-center border border-primary/10">
                          <span className="text-sm font-semibold">Total Bill Amount</span>
                          <span className="text-2xl font-bold text-primary">₹{order.amount?.total}</span>
                        </div>

                        <div className="pt-2 space-y-1">
                          <p className="text-[10px] text-muted-foreground font-mono flex justify-between">
                            <span>ORDER ID:</span>
                            <span className="truncate ml-4">{order.oid}</span>
                          </p>
                          {order.paymentId && (
                            <p className="text-[10px] text-muted-foreground font-mono flex justify-between">
                              <span>PAYMENT ID:</span>
                              <span className="truncate ml-4">{order.paymentId}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-muted-foreground">No order details available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Evidence & Description */}
              <div className="space-y-6">
                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-6 space-y-6">
                    {/* Camera Section */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold flex items-center gap-2">
                        <CameraIcon className="h-4 w-4 text-slate-500" />
                        Upload Photo (Optional)
                      </label>
                      
                      {!showCamera && !img ? (
                        <Button 
                          variant="outline" 
                          className="w-full h-40 border-dashed border-2 hover:bg-slate-50 hover:border-primary/50 transition-all flex flex-col gap-2 rounded-xl"
                          onClick={() => setShowCamera(true)}
                        >
                          <div className="p-3 rounded-full bg-slate-100 group-hover:bg-primary/10 transition-colors">
                            <CameraIcon className="h-8 w-8 text-slate-400 group-hover:text-primary transition-colors" />
                          </div>
                          <span className="text-slate-500 text-sm font-medium">Click to capture evidence photo</span>
                          <span className="text-xs text-slate-400">Helps us process your report faster</span>
                        </Button>
                      ) : showCamera ? (
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-200 bg-black aspect-video flex items-center justify-center">
                          <Camera
                            idealFacingMode={FACING_MODES.ENVIRONMENT}
                            onTakePhoto={handleTakePhoto}
                          />
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="absolute top-4 right-4"
                            onClick={() => setShowCamera(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : img ? (
                        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-md ring-1 ring-slate-200 group">
                          <Image src={img} fill alt="Captured" className="object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="gap-2 font-bold"
                              onClick={() => {
                                setImage(null)
                                setShowCamera(true)
                              }}
                            >
                              <RotateCcw className="h-4 w-4" />
                              Retake Photo
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Description Section */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-slate-500" />
                        What happened? <span className="text-destructive">*</span>
                      </label>
                      <Textarea
                        placeholder="Please describe the issue in at least 10 characters..."
                        rows={5}
                        value={descField}
                        onChange={(e) => setDescField(e.target.value)}
                        className="resize-none shadow-sm focus:ring-primary/20 rounded-xl"
                      />
                      {descField.length > 0 && descField.length < 10 && (
                        <p className="text-xs text-destructive flex items-center gap-1.5 font-medium bg-destructive/5 p-2 rounded-md animate-in fade-in slide-in-from-top-1">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Please provide a bit more detail (min 10 characters)
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      size="lg"
                      className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20 rounded-xl"
                      onClick={handleSubmit}
                      disabled={!enableSubmit || isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Submitting...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          Submit Report
                        </div>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Stack>
        </Container>
      </div>
    </>
  )
}

export default ReportIssue


// export const getServerSideProps: GetServerSideProps = async (context) => {
//   if (!context.req.headers.referer) {
//     return {
//       redirect: { permanent: false, destination: `/${context.query.mid}` },
//     };
//   }

//   return {
//     props: {},
//   };
// };
