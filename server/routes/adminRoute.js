import express from "express"
import admin from "../middlewares/admin.js"
import { getReportIssues, updateItem } from "../controllers/adminController.js"

const router = express.Router()

router.post("/updateItem", admin, updateItem)
router.get("/getreportIssues", admin, getReportIssues)

export default router

;`
# Admin Routes

This module exports an Express router for admin related endpoints.

## Endpoints

### POST /updateItem

This endpoint is protected by the "admin" middleware. It calls the "updateItem" function from the "adminController".

#### Middleware

- "admin": A middleware that checks if the user is an admin.

#### Controller

- "updateItem": A function that updates an item. The details of the item to be updated should be provided in the request body.

### GET /getreportIssues

This endpoint is protected by the "admin" middleware. It calls the "getReportIssues" function from the "adminController".

#### Middleware

- "admin": A middleware that checks if the user is an admin.

#### Controller

- "getReportIssues": A function that gets reported issues.

## Export

- The router is exported as default.
`
