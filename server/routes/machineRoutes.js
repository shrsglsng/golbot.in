import express from "express";
import admin from "../middlewares/admin.js";
import {
  getIpAddress,
  getMachine,
  createMachine,
  machineLogin,
  updateIpAddress,
} from "../controllers/machineController.js";
import {
  plateDispensed,
  startMachine,
} from "../controllers/machineController.js";
import machineAuth from "../middlewares/machineAuth.js";

const router = express.Router();

router.post("/login", machineLogin);

router.post("/create", admin, createMachine);
router.get("/getMachine/:mid", getMachine);

router.get("/getIpaddress/:mid", getIpAddress);
router.post("/updateIpAddress/:mid", updateIpAddress);

// TODO: add machineAUth middleware (there som prob with jwt.verify)
router.post("/startmachine", startMachine);
router.post("/plateDispensed/:oid", plateDispensed);

export default router;
