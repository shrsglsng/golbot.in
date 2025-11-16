import Head from "next/head"
import { useState } from "react"
import Image from "next/image"
import Camera, { FACING_MODES } from "react-html5-camera-photo"
import "react-html5-camera-photo/build/css/index.css"
import { GetServerSideProps } from "next/types"
import Navbar from "../../shared/navbar"
import axios from "axios"
import FormData from "form-data"
import { useSelector } from "react-redux"
import { selectOrder } from "../../redux/orderSlice"
import { useRouter } from "next/router"
import { reportIssue } from "../../services/order"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Container } from "@/components/layout/Container"
import { Stack } from "@/components/layout/Stack"
import { RotateCcw, Camera as CameraIcon, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

function ReportIssue() {
  const [img, setImage] = useState(null)
  const [showCamera, setShowCamera] = useState<boolean>(true)
  const [enableSubmit, setEnableSubmit] = useState<boolean>(false)
  const [descField, setDescField] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const order = useSelector(selectOrder)
  const router = useRouter()

  function handleTakePhoto(dataUri: any) {
    setImage(dataUri)
    setShowCamera(false)

    if (descField.length > 0 && dataUri !== null) {
      setEnableSubmit(true)
    }
  }

  async function url2File(url: string, fileName: string) {
    const blob = await (await fetch(url)).blob()
    return new File([blob], fileName, { type: blob.type })
  }

  async function handleSubmit() {
    try {
      setIsSubmitting(true)
      const oid = order?.oid ?? ""
      let data = new FormData()
      data.append("oid", oid)
      data.append("description", descField)
      data.append("machineId", router.query.mid as string)
      data.append("image", await url2File(img ?? "", `im${oid}.png`))

      if (await reportIssue(data)) {
        toast.success("Issue reported successfully! We'll look into it and get back to you soon.")
        setTimeout(() => {
          router.push(`/${router.query.mid}`)
        }, 1500)
      } else {
        toast.error("Failed to report issue. Please try again or contact support.")
      }
    } catch (error) {
      toast.error("Failed to report issue. Please try again or contact support.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Head>
        <title>Report Issue - GolBot</title>
        <meta name="description" content="Report an issue with your order" />
      </Head>

      <div className="min-h-screen pb-24">
        <Navbar />

        <Container size="sm" className="py-24">
          <Stack spacing="lg">
            {/* Header */}
            <Stack spacing="sm" align="center">
              <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-center">Report an Issue</h1>
              <p className="text-muted-foreground text-center max-w-md text-sm">
                Take a photo of the issue and describe what happened. We&apos;ll investigate and get back to you.
              </p>
            </Stack>

            {/* Camera Card */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {showCamera ? (
                  <div className="relative">
                    <Camera
                      idealFacingMode={FACING_MODES.ENVIRONMENT}
                      onTakePhoto={(dataUri) => {
                        handleTakePhoto(dataUri)
                      }}
                    />
                  </div>
                ) : (
                  <div className="relative aspect-video bg-muted">
                    <Image
                      src={img ?? ""}
                      fill
                      alt="Captured issue"
                      className="object-cover"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute bottom-4 right-4 shadow-lg"
                      onClick={() => {
                        setImage(null)
                        setShowCamera(true)
                      }}
                    >
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Stack spacing="sm">
              <label className="text-sm font-medium">
                Issue Description <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Please describe the issue in detail..."
                rows={6}
                value={descField}
                onChange={(e) => {
                  setDescField(e.target.value)
                  if (e.target.value.length > 0 && img !== null) {
                    setEnableSubmit(true)
                  } else {
                    setEnableSubmit(false)
                  }
                }}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {descField.length === 0 && "Please provide details about the issue"}
                {descField.length > 0 && img === null && "Please take a photo of the issue"}
              </p>
            </Stack>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!enableSubmit || isSubmitting}
              loading={isSubmitting}
              size="lg"
              className="w-full"
            >
              Submit Report
            </Button>
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
