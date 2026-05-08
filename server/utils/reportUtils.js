import Counter from "../models/counterModel.js";

/**
 * Generate a unique report ID
 * Format: R-YYYYMMDD-XXXX (e.g., R-20250115-0001)
 * Uses Counter model to prevent race conditions and ensure atomicity
 */
export async function generateReportId() {
  const today = new Date();
  // Using ISO string for consistent UTC-based date string YYYYMMDD
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  // Get next sequence for this specific date
  // This will create a new counter entry for each day automatically
  const sequence = await Counter.getNextSequence(`report_${dateStr}`);

  return `R-${dateStr}-${sequence.toString().padStart(4, '0')}`;
}

