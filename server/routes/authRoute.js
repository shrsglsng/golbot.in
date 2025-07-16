import express from "express";
import {
  adminLogin,
  adminRegister,
  anonRegister,
  getAllAdmins,
  getAllMachines,
  machineLogin,
  machineRegister,
  phoneSendOtp,
  verifyOtp,
} from "../controllers/authController.js";
import admin from "../middlewares/admin.js";

const router = express.Router();

router.post("/createAnon", anonRegister);
router.post("/sendOTP", phoneSendOtp);
router.post("/verifyOTP", verifyOtp);

router.post("/admin/register", admin, adminRegister);
router.post("/admin/login", adminLogin);
router.get("/admin/getAllAdmins", admin, getAllAdmins);

router.post("/admin/machineRegister", admin, machineRegister);
// router.post("/admin/machineLogin", machineLogin);
router.get("/admin/getAllMachines", admin, getAllMachines);

export default router;
