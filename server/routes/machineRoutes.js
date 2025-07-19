import express from "express";
import {
  machineLogin,
  getMachine,
  getIpAddress,
  updateIpAddress,
  startMachine,
  plateDispensed
} from "../controllers/machineController.js";
import admin from "../middlewares/admin.js";
import machineAuth from "../middlewares/machineAuth.js";

const router = express.Router();

// Machine login
router.post("/login", machineLogin);

// CRUD & IP management
router.get("/:mid", getMachine);
router.get("/:mid/ip", getIpAddress);
router.post("/:mid/ip", updateIpAddress);

// Protected machine operations
router.post("/start", machineAuth, startMachine);
router.post("/plate-dispensed/:oid", machineAuth, plateDispensed);

export default router;
