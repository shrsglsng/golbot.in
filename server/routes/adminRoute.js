import express from "express";
import admin from "../middlewares/admin.js";
import {
  addItem,
  updateItem,
  getReportIssues,
  getAllAdmins,
  registerAdmin,
  loginAdmin,
  registerMachine,
  getAllMachines,
  updateOrderStatus,
  getOrderStatusHistory,
  updatePaymentStatus,
  getPaymentStatusHistory
} from "../controllers/adminController.js";

const router = express.Router();

// Item management
router.post("/items", admin, addItem);
router.put("/items/:itemId", admin, updateItem);

// Issue Reports
router.get("/issues", admin, getReportIssues);

// Admin management
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/admins", admin, getAllAdmins);

// Machine management
router.post("/machines", admin, registerMachine);
router.get("/machines", admin, getAllMachines);

// Order management with status history
router.put("/orders/:orderId/status", admin, updateOrderStatus);
router.get("/orders/:orderId/history", admin, getOrderStatusHistory);

// Payment management with status history
router.put("/payments/:paymentId/status", admin, updatePaymentStatus);
router.get("/payments/:paymentId/history", admin, getPaymentStatusHistory);

export default router;
