import Item from "../models/itemModel.js";
import logger from "../utils/logger.js";
import DatabaseUtil from "../utils/database.js";
import ApiResponse from "../utils/response.js";

// ----------------------------------------------------------------
// Get all available menu items
export const getAllItems = async (req, res) => {
  try {
    logger.info('Fetching all available menu items');

    const items = await DatabaseUtil.find(Item, 
      { isAvailable: true }, 
      { select: "-__v -updatedAt" }
    );

    logger.debug('Available items retrieved', { 
      count: items.length,
      itemIds: items.map(item => item._id) 
    });

    return ApiResponse.success(res, { 
      items 
    }, "Menu items retrieved successfully");

  } catch (error) {
    logger.error('Failed to fetch menu items', { 
      error: error.message 
    });
    throw error;
  }
};
