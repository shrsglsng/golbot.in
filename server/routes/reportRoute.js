import express from "express";
import {
  startReport,
  getAllReports,
  getReportById,
  updateReportStatus,
  markReportAsSeen,
  getUnseenCount
} from "../controllers/reportController.js";
import auth from "../middlewares/auth.js";
import admin from "../middlewares/admin.js";
import { optionalAuth } from "../middlewares/optionalAuth.js";

const router = express.Router();

// User endpoints
router.post("/start", optionalAuth, startReport);

// Admin endpoints
router.get("/", admin, getAllReports);
router.get("/unseen/count", admin, getUnseenCount);
router.get("/:reportId", admin, getReportById);
router.put("/:reportId/status", admin, updateReportStatus);
router.put("/:reportId/seen", admin, markReportAsSeen);

export default router;
