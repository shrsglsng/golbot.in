import axios from "axios"
import { StatusCodes } from "http-status-codes"
import sha256 from "js-sha256"
import Order from "../models/orderModel.js"

export const paymentWebhook = async (req, res) => {
  console.log(req.body)
  console.log(JSON.parse(atob(req.body.response)))

  const decodedRes = JSON.parse(atob(req.body.response))
  res.status(StatusCodes.OK).json({ msg: "Payment successful" })
}

export const getPaymentStatus = async (req, res) => {
  const { merchantTransactionId } = req.params

  const SALT_INDEX = process.env.PHONEPE_SALT_INDEX
  const SALT_KEY = process.env.PHONEPE_SALT_KEY
  const merchantId = process.env.PHONEPE_MERCHANT_ID

  const xVerify =
    sha256(`/pg/v1/status/${merchantId}/${merchantTransactionId}` + SALT_KEY) +
    "###" +
    SALT_INDEX
  const options = {
    method: "get",
    url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`,
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": xVerify,
      "X-MERCHANT-ID": merchantId,
    },
  }
  await axios
    .request(options)
    .then(async function (response) {
      console.log(response.data)
      if (response.data.code === "PAYMENT_SUCCESS") {
        var tmpOtp = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000)
        await Order.updateOne(
          { paymentOrderId: response.data.merchantTransactionId },
          { ostatus: "READY", orderOtp: tmpOtp }
        )
        res
          .status(StatusCodes.OK)
          .json({ msg: "Payment Successful", code: "PAYMENT_SUCCESS" })
      } else if (response.data.code === "PAYMENT_PENDING") {
        res
          .status(StatusCodes.OK)
          .json({ msg: "Payment Pending", code: "PAYMENT_PENDING" })
      } else if (response.data.code === "PAYMENT_ERROR") {
        res
          .status(StatusCodes.OK)
          .json({ msg: "Payment Failed", code: "PAYMENT_ERROR" })
      } else {
        res.status(StatusCodes.NOT_FOUND).json({ msg: "Payment Not Found" })
      }
    })
    .catch(function (error) {
      console.log(error)
      res.status(StatusCodes.NOT_FOUND).json({ msg: "Payment Not Found" })
    })
}
