import fs from "fs";
import path from "path";
import ReportIssue from "../models/reportIssueModel.js";
import logger from "./logger.js";

/**
 * Automatically deletes images attached to resolved reports after a certain period
 * @param {number} hours - Number of hours to wait before deleting (default 48)
 */
export const cleanupOldReportImages = async (hours = 48) => {
  try {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    logger.info('🧹 Starting scheduled cleanup of old report images', { 
      hours, 
      cutoffDate: cutoffDate.toISOString() 
    });

    // Find reports that are resolved, have an image, and haven't been updated for the specified time
    const reportsToCleanup = await ReportIssue.find({
      status: 'resolved',
      imgUrl: { $exists: true, $ne: "" },
      updatedAt: { $lt: cutoffDate }
    });

    if (reportsToCleanup.length === 0) {
      logger.info('✅ No old report images found for cleanup');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const report of reportsToCleanup) {
      try {
        // Extract filename from URL (format: /api/v1/uploads/filename.jpg or /uploads/filename.jpg)
        const parts = report.imgUrl.split('/');
        const filename = parts[parts.length - 1];
        
        if (!filename) continue;

        const filePath = path.join("uploads", filename);

        // Check if file exists before trying to delete
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          logger.debug(`Deleted image file: ${filePath} for report ${report.reportId}`);
        } else {
          logger.warn(`File not found during cleanup: ${filePath} for report ${report.reportId}`);
        }

        // Clear the image URL in database but keep the report record
        report.imgUrl = "";
        await report.save();
        successCount++;

      } catch (err) {
        logger.error(`Failed to clean up image for report ${report.reportId}`, { error: err.message });
        failCount++;
      }
    }

    logger.info('🏁 Cleanup completed', { 
      totalProcessed: reportsToCleanup.length, 
      successCount, 
      failCount 
    });

  } catch (error) {
    logger.error('❌ Error during report image cleanup job', { error: error.message });
  }
};

/**
 * Initializes the cleanup scheduler
 */
export const initCleanupScheduler = () => {
  // Run once on startup
  setTimeout(() => cleanupOldReportImages(48), 10000); // Wait 10s for DB connection to stabilize

  // Then run every 12 hours
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;
  setInterval(() => {
    cleanupOldReportImages(48);
  }, TWELVE_HOURS);
  
  logger.info('⏰ Report image cleanup scheduler initialized (12h interval, 48h threshold)');
};
