import { useState } from "react"
import Image from "next/image"
import RefreshIcon from "@mui/icons-material/Refresh"
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

function ReportIssue() {
  const [img, setImage] = useState(null)
  const [showCamera, setShowCamera] = useState<boolean>(true)
  const [enableSubmit, setEnableSubmit] = useState<boolean>(false)
  const [descField, setDescField] = useState<string>("")
  const order = useSelector(selectOrder)
  const router = useRouter()

  function handleTakePhoto(dataUri: any) {
    // Do stuff with the photo...
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
    const oid = order?.oid ?? ""
    let data = new FormData()
    data.append("oid", oid)
    data.append("description", descField)
    data.append("machineId", router.query.mid as string)
    data.append("image", await url2File(img ?? "", `im${oid}.png`))

    if (await reportIssue(data)) {
      router.push(`/${router.query.mid}`)
    }
  }

  return (
    <>
      <div className="w-full fixed top-0 z-10">
        <Navbar />
      </div>
      <div className="w-full grid place-items-center">
        <div className="w-full md:w-1/2 lg:w-1/4 flex flex-col p-5">
          <div className="h-20" />
          {/* camera */}
          {/* <div className="h-5" /> */}
          <>
            {showCamera ? (
              <Camera
                idealFacingMode={FACING_MODES.ENVIRONMENT}
                onTakePhoto={(dataUri) => {
                  handleTakePhoto(dataUri)
                }}
              />
            ) : (
              // eslint-disable-next-line jsx-a11y/alt-text
              <div className="w-full h-96 relative rounded-md">
                <Image src={img ?? ""} fill={true} alt="" />
                <button
                  className="absolute p-1 bottom-2 right-2 text-black z-10 bg-gray-400 rounded-full"
                  onClick={() => {
                    setImage(null)
                    setShowCamera(true)
                  }}>
                  <RefreshIcon fontSize="large" />
                </button>
              </div>
            )}
          </>

          {/* input text field */}
          <div className="h-8" />
          <div className="">
            <textarea
              className="w-full p-3 border-2 border-gray-400 text-gray-500 rounded-md focus:border-black focus:text-black"
              placeholder="Please describe the issue...."
              cols={10}
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
            />
          </div>

          {/* Submit Button */}
          <div className="h-8" />
          <button
            className="w-full py-3 bg-cblue rounded-md text-white hover:bg-cbluel active:bg-cblue disabled:bg-cbluel"
            disabled={!enableSubmit}
            onClick={handleSubmit}>
            {" "}
            Submit{" "}
          </button>
        </div>
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
