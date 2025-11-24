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

    // Transform _id to id for frontend compatibility
    const transformedItems = items.map(item => ({
      id: item._id,
      name: item.name,
      desc: item.desc,
      imgUrl: item.imgUrl,
      price: item.price,
      gst: item.gst,
      isAvailable: item.isAvailable
    }));

    return ApiResponse.success(res, {
      items: transformedItems
    }, "Menu items retrieved successfully");

  } catch (error) {
    logger.error('Failed to fetch menu items', {
      error: error.message
    });
    throw error;
  }
};
