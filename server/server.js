import express from "express"
import bodyParser from "body-parser"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
dotenv.config()
import "express-async-errors"
import morgan from "morgan"
import mongoSanitize from "express-mongo-sanitize"
import helmet from "helmet"

// routes
import AuthRoute from "./routes/authRoute.js"
import AdminRoute from "./routes/adminRoute.js"
import OrderRoute from "./routes/orderRoute.js"
import MachineRoute from "./routes/machineRoutes.js"
import PaymentRoute from "./routes/paymentRoutes.js"
import paymentWebhook from "./routes/paymentWebhook.js"

import { getAllItems } from "./controllers/utilController.js"

//middlewares
import notFoundMiddleware from "./middlewares/notFound.js"
import errorHandlerMiddleware from "./middlewares/errorHandler.js"

// constants
const BASE_URL_PATH = "/api/v1/"
const CONNECTION_URL =
  process.env.EXPAPP_MONGO_URL || process.env.EXPAPP_MONGO_LOCAL_URL
const PORT = process.env.PORT || process.env.EXPAPP_PORT || 5000

const app = express()

app.use(helmet())

// if (process.env.NODE_ENV !== "production") {
app.use(morgan("dev"))
// }

app.use("/api/webhook", paymentWebhook);

app.use(bodyParser.json({ limit: "30mb", extended: true }))
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }))
app.use(cors())

app.use(
  mongoSanitize({
    replaceWith: "_",
    onSanitize: ({ req, key }) => {
      console.warn(`This request[${key}] is sanitized`, req)
    },
  })
)

app.use(`${BASE_URL_PATH}auth`, AuthRoute)
app.use(`${BASE_URL_PATH}admin`, AdminRoute)
app.use(`${BASE_URL_PATH}order`, OrderRoute)
app.use(`${BASE_URL_PATH}machine`, MachineRoute)
app.use(`${BASE_URL_PATH}payment`, PaymentRoute)

app.get(`${BASE_URL_PATH}getAllItems`, getAllItems)

app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)

mongoose.set("strictQuery", true)
mongoose
  .connect(CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() =>
    app.listen(PORT, () =>
      console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`)
    )
  )
  .catch((error) => console.log(error.message))
