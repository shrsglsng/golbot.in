import express from "express";
import firmwareAuth from "../middlewares/firmwareAuth.js";
import blockBrowserAccess from "../middlewares/blockBrowserAccess.js";
import {
  getNextOrder,
  startOrderPreparation,
  markOrderReady,
  completeOrder,
  cancelOrder,
  getMachineStatus,
  getOrderStatusById,
  sendHeartbeat,
  logFirmwareError
} from "../controllers/firmwareController.js";

const router = express.Router();

// SECURITY: Block all browser access to firmware endpoints
// Browsers send Origin header, native apps don't
// This prevents phishing, CSRF, and credential theft attacks
router.use(blockBrowserAccess);

// ----------------------------------------------------------------
// Order Management Endpoints
// ----------------------------------------------------------------

/**
 * GET /api/firmware/orders/next
 * Get next pending order for this machine
 *
 * Auth: Required (X-Machine-ID + X-Machine-Password)
 * Query: mid (optional if in headers)
 *
 * Response:
 * {
 *   hasOrder: true,
 *   order: {
 *     orderId: "...",
 *     orderOtp: "1234",
 *     orderCounter: 42,
 *     items: [...],
 *     amount: {...}
 *   }
 * }
 */
router.get("/orders/next", firmwareAuth, getNextOrder);

/**
 * POST /api/firmware/orders/:orderId/start
 * Start preparing an order
 *
 * Auth: Required
 * Body: {} (machineId from auth)
 *
 * Updates: PAID → PREPARING
 * Deducts puris from machine
 */
router.post("/orders/:orderId/start", firmwareAuth, startOrderPreparation);

/**
 * POST /api/firmware/orders/:orderId/ready
 * Mark order ready for pickup
 *
 * Auth: Required
 * Body: {} (machineId from auth)
 *
 * Updates: PREPARING → READY_FOR_PICKUP
 */
router.post("/orders/:orderId/ready", firmwareAuth, markOrderReady);

/**
 * POST /api/firmware/orders/:orderId/complete
 * Complete order (plate dispensed)
 *
 * Auth: Required
 * Body: {} (machineId from auth)
 *
 * Updates: READY_FOR_PICKUP → COMPLETED
 * Machine status: READY_FOR_PICKUP → CONNECTED (idle)
 */
router.post("/orders/:orderId/complete", firmwareAuth, completeOrder);

/**
 * POST /api/firmware/orders/:orderId/cancel
 * Cancel an order
 *
 * Auth: Required
 * Body: { reason: "Dispenser error" }
 *
 * Updates: ANY → CANCELLED
 * Refunds puris if order was PREPARING/READY_FOR_PICKUP
 */
router.post("/orders/:orderId/cancel", firmwareAuth, cancelOrder);

/**
 * GET /api/firmware/orders/:orderId/status
 * Get specific order status by ID
 *
 * Auth: Required
 *
 * Used when APK has stored order ID but getMachineStatus returns null
 * Security: Validates order belongs to authenticated machine
 *
 * Response:
 * {
 *   orderId: "...",
 *   orderStatus: "COMPLETED",
 *   orderCompleted: true,
 *   actualCompletionTime: "2024-...",
 *   updatedAt: "2024-..."
 * }
 */
router.get("/orders/:orderId/status", firmwareAuth, getOrderStatusById);

// ----------------------------------------------------------------
// Machine Status Endpoints
// ----------------------------------------------------------------

/**
 * GET /api/firmware/machine/status
 * Get current machine status and active order
 *
 * Auth: Required
 *
 * Response:
 * {
 *   machineId: "M01",
 *   status: "CONNECTED",
 *   currentOrder: {...} or null,
 *   puriQuantity: 100,
 *   isLowStock: false
 * }
 */
router.get("/machine/status", firmwareAuth, getMachineStatus);

/**
 * POST /api/firmware/heartbeat
 * Send heartbeat to server
 *
 * Auth: Required
 * Body: {
 *   status: "IDLE" | "BUSY" | "ERROR",
 *   firmwareVersion: "1.0.0" (optional)
 * }
 *
 * Response:
 * {
 *   received: true,
 *   hasNewOrder: false
 * }
 */
router.post("/heartbeat", firmwareAuth, sendHeartbeat);

// ----------------------------------------------------------------
// Error Reporting
// ----------------------------------------------------------------

/**
 * POST /api/firmware/error
 * Log firmware error
 *
 * Auth: Required
 * Body: {
 *   errorCode: "DISPENSER_JAM",
 *   errorMessage: "Motor stalled",
 *   orderId: "..." (optional),
 *   severity: "WARNING" | "ERROR" | "CRITICAL"
 * }
 */
router.post("/error", firmwareAuth, logFirmwareError);

export default router;
