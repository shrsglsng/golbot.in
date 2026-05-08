import fs from "fs";
import path from "path";
import ReportIssue from "../models/reportIssueModel.js";
import logger from "./logger.js";

/**
 * Automatically deletes images attached to resolved reports after a certain period
 * @param {number} minutes - Number of minutes to wait before deleting (default 1)
 */
export const cleanupOldReportImages = async (minutes = 1) => {
  try {
    const cutoffDate = new Date(Date.now() - minutes * 60 * 1000);

    logger.info('🧹 Starting scheduled cleanup of old report images', { 
      minutes, 
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
  setTimeout(() => cleanupOldReportImages(1), 5000); // Wait 5s for DB connection

  // Then run every 10 seconds for testing
  const TEN_SECONDS = 10 * 1000;
  setInterval(() => {
    cleanupOldReportImages(1);
  }, TEN_SECONDS);
  
  logger.info('⏰ Report image cleanup scheduler initialized (TESTING: 10s interval, 1m threshold)');
};
