import express from "express";
import {
  resolveMachineFromToken,
  getMachineById
} from "../controllers/publicMachineController.js";

const router = express.Router();

// Public machine endpoints (no auth required)
router.get("/resolve", resolveMachineFromToken); // GET /api/v1/machines/resolve?mt=<token>
router.get("/:machineId", getMachineById);       // GET /api/v1/machines/M01

export default router;
