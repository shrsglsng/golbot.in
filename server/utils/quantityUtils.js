import Item from "../models/itemModel.js";
import Machine from "../models/machineModel.js";
import DatabaseUtil from "./database.js";
import logger from "./logger.js";
import { BadRequestError, NotFoundError } from "./errors.js";

/**
 * Calculate total puris needed for a given set of order items
 * @param {Array} items - Array of items with structure: [{ id: itemId, quantity: number }]
 * @returns {Promise<{totalPuris: number, itemsBreakdown: Array}>}
 */
export const calculatePurisNeeded = async (items) => {
  let totalPuris = 0;
  const itemsBreakdown = [];

  for (const item of items) {
    const dbItem = await DatabaseUtil.findById(Item, item.id || item._id);

    if (!dbItem) {
      throw new NotFoundError(`Item not found: ${item.id || item._id}`);
    }

    const purisForItem = dbItem.puriPerPlate * item.quantity;
    totalPuris += purisForItem;

    itemsBreakdown.push({
      itemId: dbItem._id,
      itemName: dbItem.name,
      quantity: item.quantity,
      puriPerPlate: dbItem.puriPerPlate,
      totalPuris: purisForItem
    });

    logger.debug('Puri calculation for item', {
      itemName: dbItem.name,
      quantity: item.quantity,
      puriPerPlate: dbItem.puriPerPlate,
      totalPuris: purisForItem
    });
  }

  return { totalPuris, itemsBreakdown };
};

/**
 * Check if a machine has sufficient puris for an order
 * @param {String} machineId - Machine ObjectId
 * @param {Number} purisNeeded - Total puris needed
 * @returns {Promise<{hasEnough: boolean, currentQuantity: number, needed: number, remaining: number, isLowStock: boolean}>}
 */
export const checkMachinePuriAvailability = async (machineId, purisNeeded) => {
  const machine = await DatabaseUtil.findById(Machine, machineId);

  if (!machine) {
    throw new NotFoundError('Machine not found');
  }

  const currentQuantity = machine.puriQuantity || 0;
  const hasEnough = currentQuantity >= purisNeeded;
  const remaining = currentQuantity - purisNeeded;
  const isLowStock = remaining < machine.lowQuantityThreshold;

  logger.debug('Machine puri availability check', {
    machineId: machine.mid,
    currentQuantity,
    purisNeeded,
    hasEnough,
    remaining,
    isLowStock,
    threshold: machine.lowQuantityThreshold
  });

  return {
    hasEnough,
    currentQuantity,
    needed: purisNeeded,
    remaining: Math.max(0, remaining),
    isLowStock: hasEnough && isLowStock
  };
};

/**
 * Deduct puris from machine quantity (atomic operation)
 * @param {String} machineId - Machine ObjectId
 * @param {Number} purisToDeduct - Number of puris to deduct
 * @param {Object} metadata - Additional metadata for logging
 * @returns {Promise<{success: boolean, newQuantity: number, isLowStock: boolean}>}
 */
export const deductMachinePuris = async (machineId, purisToDeduct, metadata = {}) => {
  // Use optimistic locking to prevent race conditions
  // Check quantity before deducting (atomic operation)
  const machine = await Machine.findOneAndUpdate(
    {
      _id: machineId,
      puriQuantity: { $gte: purisToDeduct } // Only update if enough puris available
    },
    { $inc: { puriQuantity: -purisToDeduct } },
    { new: true, runValidators: true }
  );

  if (!machine) {
    // Either machine doesn't exist OR insufficient puris
    const machineExists = await Machine.findById(machineId);

    if (!machineExists) {
      throw new NotFoundError('Machine not found');
    }

    // Machine exists but insufficient puris
    logger.warn('Insufficient puris for deduction', {
      machineId: machineExists.mid,
      currentQuantity: machineExists.puriQuantity,
      requested: purisToDeduct,
      metadata
    });

    throw new BadRequestError(
      `Insufficient puris available. Current: ${machineExists.puriQuantity}, Needed: ${purisToDeduct}`
    );
  }

  const isLowStock = machine.puriQuantity < machine.lowQuantityThreshold;

  if (isLowStock) {
    logger.warn('Machine puri quantity is low', {
      machineId: machine.mid,
      currentQuantity: machine.puriQuantity,
      threshold: machine.lowQuantityThreshold,
      estimatedOrdersRemaining: Math.floor(machine.puriQuantity / 6) // Assuming average 6 puris per order
    });
  }

  logger.info('Puris deducted from machine', {
    machineId: machine.mid,
    deducted: purisToDeduct,
    newQuantity: machine.puriQuantity,
    isLowStock,
    ...metadata
  });

  return {
    success: true,
    newQuantity: machine.puriQuantity,
    isLowStock
  };
};

/**
 * Refund/add puris back to machine (e.g., when order is cancelled)
 * @param {String} machineId - Machine ObjectId
 * @param {Number} purisToAdd - Number of puris to add back
 * @param {Object} metadata - Additional metadata for logging
 * @returns {Promise<{success: boolean, newQuantity: number}>}
 */
export const refundMachinePuris = async (machineId, purisToAdd, metadata = {}) => {
  const machine = await Machine.findByIdAndUpdate(
    machineId,
    { $inc: { puriQuantity: purisToAdd } },
    { new: true, runValidators: true }
  );

  if (!machine) {
    throw new NotFoundError('Machine not found');
  }

  logger.info('Puris refunded to machine', {
    machineId: machine.mid,
    refunded: purisToAdd,
    newQuantity: machine.puriQuantity,
    ...metadata
  });

  return {
    success: true,
    newQuantity: machine.puriQuantity
  };
};

/**
 * Refill machine puris (admin operation)
 * @param {String} machineId - Machine ObjectId or mid
 * @param {Number} purisToAdd - Number of puris to add
 * @param {Object} metadata - Additional metadata (adminId, etc.)
 * @returns {Promise<{success: boolean, previousQuantity: number, newQuantity: number}>}
 */
export const refillMachinePuris = async (machineId, purisToAdd, metadata = {}) => {
  // Find machine by ObjectId or mid
  let machine;
  if (machineId.length === 24) {
    // Likely ObjectId
    machine = await DatabaseUtil.findById(Machine, machineId);
  } else {
    // Likely mid (machine identifier)
    machine = await DatabaseUtil.findOne(Machine, { mid: machineId.toUpperCase() });
  }

  if (!machine) {
    throw new NotFoundError('Machine not found');
  }

  const previousQuantity = machine.puriQuantity;

  const updatedMachine = await Machine.findByIdAndUpdate(
    machine._id,
    { $inc: { puriQuantity: purisToAdd } },
    { new: true, runValidators: true }
  );

  logger.info('Machine puris refilled', {
    machineId: updatedMachine.mid,
    previousQuantity,
    added: purisToAdd,
    newQuantity: updatedMachine.puriQuantity,
    ...metadata
  });

  return {
    success: true,
    previousQuantity,
    newQuantity: updatedMachine.puriQuantity,
    machineId: updatedMachine.mid
  };
};

/**
 * Set machine puri quantity to a specific value (admin operation)
 * @param {String} machineId - Machine ObjectId or mid
 * @param {Number} quantity - New quantity to set
 * @param {Object} metadata - Additional metadata (adminId, etc.)
 * @returns {Promise<{success: boolean, previousQuantity: number, newQuantity: number}>}
 */
export const setMachinePuriQuantity = async (machineId, quantity, metadata = {}) => {
  // Find machine by ObjectId or mid
  let machine;
  if (machineId.length === 24) {
    machine = await DatabaseUtil.findById(Machine, machineId);
  } else {
    machine = await DatabaseUtil.findOne(Machine, { mid: machineId.toUpperCase() });
  }

  if (!machine) {
    throw new NotFoundError('Machine not found');
  }

  const previousQuantity = machine.puriQuantity;

  const updatedMachine = await Machine.findByIdAndUpdate(
    machine._id,
    { puriQuantity: quantity },
    { new: true, runValidators: true }
  );

  logger.info('Machine puri quantity set', {
    machineId: updatedMachine.mid,
    previousQuantity,
    newQuantity: updatedMachine.puriQuantity,
    ...metadata
  });

  return {
    success: true,
    previousQuantity,
    newQuantity: updatedMachine.puriQuantity,
    machineId: updatedMachine.mid
  };
};

/**
 * Get machine puri status
 * @param {String} machineId - Machine ObjectId or mid
 * @returns {Promise<{machineId: string, currentQuantity: number, threshold: number, isLowStock: boolean, estimatedOrders: number}>}
 */
export const getMachinePuriStatus = async (machineId) => {
  let machine;
  if (machineId.length === 24) {
    machine = await DatabaseUtil.findById(Machine, machineId);
  } else {
    machine = await DatabaseUtil.findOne(Machine, { mid: machineId.toUpperCase() });
  }

  if (!machine) {
    throw new NotFoundError('Machine not found');
  }

  const currentQuantity = machine.puriQuantity || 0;
  const threshold = machine.lowQuantityThreshold || 30;
  const isLowStock = currentQuantity < threshold;
  const estimatedOrders = Math.floor(currentQuantity / 6); // Assuming average 6 puris per order

  return {
    machineId: machine.mid,
    machineName: machine.name,
    currentQuantity,
    threshold,
    isLowStock,
    estimatedOrders,
    status: machine.mstatus
  };
};

export default {
  calculatePurisNeeded,
  checkMachinePuriAvailability,
  deductMachinePuris,
  refundMachinePuris,
  refillMachinePuris,
  setMachinePuriQuantity,
  getMachinePuriStatus
};
