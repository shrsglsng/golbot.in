import express from "express";
import {
  machineLogin,
  getMachine,
  getIpAddress,
  updateIpAddress,
  startMachine,
  markOrderReadyForPickup,
  plateDispensed,
  cancelOrder
} from "../controllers/machineController.js";
import machineAuth from "../middlewares/machineAuth.js";
import validateMobileApp from "../middlewares/mobileAuth.js";

const router = express.Router();

// Machine login - with mobile app validation
router.post("/login", validateMobileApp, machineLogin);

// CRUD & IP management
router.get("/:mid", getMachine);
router.get("/:mid/ip", getIpAddress);
router.post("/:mid/ip", updateIpAddress);

// Protected machine operations - with mobile app validation
router.post("/startmachine", validateMobileApp, machineAuth, startMachine);
router.post("/start", validateMobileApp, machineAuth, startMachine); // Keep both for compatibility
router.post("/ready-for-pickup", validateMobileApp, machineAuth, markOrderReadyForPickup);
router.post("/plate-dispensed", validateMobileApp, machineAuth, plateDispensed);
router.post("/cancel-order", validateMobileApp, machineAuth, cancelOrder);

export default router;
