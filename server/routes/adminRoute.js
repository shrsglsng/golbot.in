import express from "express";
import admin, { optionalAuth } from "../middlewares/admin.js";
import {
  getAllItemsAdmin,
  addItem,
  updateItem,
  upsertItem,
  getReportIssues,
  getAllAdmins,
  registerAdmin,
  loginAdmin,
  registerMachine,
  getAllMachines,
  updateMachineStatus,
  softDeleteMachine,
  restoreMachine,
  updateOrderStatus,
  getOrderStatusHistory,
  updatePaymentStatus,
  getPaymentStatusHistory,
  adminMarkOrderReady
} from "../controllers/adminController.js";
import {
  generateMachineQRToken,
  getMachineQRTokens,
  revokeMachineQRToken,
  verifyMachineToken
} from "../controllers/machineQRController.js";

const router = express.Router();

// Item management
router.get("/items", admin, getAllItemsAdmin);
router.post("/items", admin, addItem);
router.put("/items/:itemId", admin, updateItem);
router.post("/updateItem", admin, upsertItem);

// Issue Reports
router.get("/issues", admin, getReportIssues);

// Admin management
router.post("/register", optionalAuth, registerAdmin);
router.post("/login", loginAdmin);
router.get("/admins", admin, getAllAdmins);

// Machine management
router.post("/machines", admin, registerMachine);
router.get("/machines", admin, getAllMachines);
router.put("/machines/:machineId/status", admin, updateMachineStatus);
router.delete("/machines/:machineId", admin, softDeleteMachine);
router.put("/machines/:machineId/restore", admin, restoreMachine);

// Machine QR Token management
router.post("/machines/:machineId/qr-token", admin, generateMachineQRToken);
router.get("/machines/:machineId/qr-tokens", admin, getMachineQRTokens);
router.delete("/machines/:machineId/qr-tokens/:tokenId", admin, revokeMachineQRToken);
router.post("/machines/verify-token", admin, verifyMachineToken);

// Order management with status history
router.put("/orders/:orderId/status", admin, updateOrderStatus);
router.get("/orders/:orderId/history", admin, getOrderStatusHistory);

// Payment management with status history
router.put("/payments/:paymentId/status", admin, updatePaymentStatus);
router.get("/payments/:paymentId/history", admin, getPaymentStatusHistory);

// Manual order control (for testing/admin override)
router.put("/orders/:orderId/mark-ready", admin, adminMarkOrderReady);

export default router;
