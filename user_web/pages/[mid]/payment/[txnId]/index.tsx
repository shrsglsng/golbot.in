import { redirect } from "next/dist/server/api-utils"
import { GetServerSideProps } from "next/types"
import { useEffect } from "react"

export default function PaymentOrderId() {
  return <div>Checking Payment Status</div>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { txnId, mid } = context.query

  if (!process.env.NEXT_PUBLIC_SERVER_URL) throw "Server Url Not Set"
  const url =
    process.env.NEXT_PUBLIC_SERVER_URL + `/payment/paymentStatus/${txnId}`

  const paymentOrder = await fetch(url)

  if (paymentOrder.status === 404) {
    return {
      notFound: true, //redirects to 404 page
    }
  }

  var jsonData = await paymentOrder.json()
  if (jsonData?.code == "PAYMENT_SUCCESS") {
    return {
      redirect: {
        destination: `/${mid}/qrPage`,
        permanent: false,
      },
    }
  } else if (jsonData?.code == "PAYMENT_ERROR") {
    return {
      redirect: {
        destination: `/${mid}/payment/${txnId}/failed`,
        permanent: false,
      },
    }
  } else if (jsonData?.code == "PAYMENT_PENDING") {
    return {
      redirect: {
        destination: `/${mid}/payment/${txnId}/pending`,
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
