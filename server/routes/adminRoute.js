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
  getAllMachines
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

export default router;
