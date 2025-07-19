import mongoose from "mongoose";
import logger from "./logger.js";
import { DatabaseError } from "./errors.js";

// Database utility with enhanced error handling and logging
export class DatabaseUtil {
  static async findById(Model, id, options = {}) {
    try {
      logger.debug(`Finding ${Model.modelName} by ID`, { id });
      
      const result = await Model.findById(id, options.select, options);
      
      logger.dbLog('findById', Model.modelName, { id }, result);
      
      if (!result && options.throwIfNotFound) {
        throw new DatabaseError(`${Model.modelName} not found with ID: ${id}`);
      }
      
      return result;
    } catch (error) {
      logger.dbLog('findById', Model.modelName, { id }, null, error);
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError(`Failed to find ${Model.modelName} by ID`, 'findById');
    }
  }

  static async findOne(Model, query, options = {}) {
    try {
      logger.debug(`Finding one ${Model.modelName}`, { query });
      
      const result = await Model.findOne(query, options.select, options);
      
      logger.dbLog('findOne', Model.modelName, query, result);
      
      if (!result && options.throwIfNotFound) {
        throw new DatabaseError(`${Model.modelName} not found with query: ${JSON.stringify(query)}`);
      }
      
      return result;
    } catch (error) {
      logger.dbLog('findOne', Model.modelName, query, null, error);
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError(`Failed to find ${Model.modelName}`, 'findOne');
    }
  }

  static async find(Model, query = {}, options = {}) {
    try {
      logger.debug(`Finding ${Model.modelName} documents`, { query, options });
      
      let dbQuery = Model.find(query, options.select);
      
      if (options.sort) dbQuery = dbQuery.sort(options.sort);
      if (options.limit) dbQuery = dbQuery.limit(options.limit);
      if (options.skip) dbQuery = dbQuery.skip(options.skip);
      if (options.populate) dbQuery = dbQuery.populate(options.populate);
      
      const result = await dbQuery.exec();
      
      logger.dbLog('find', Model.modelName, query, result);
      
      return result;
    } catch (error) {
      logger.dbLog('find', Model.modelName, query, null, error);
      throw new DatabaseError(`Failed to find ${Model.modelName} documents`, 'find');
    }
  }

  static async create(Model, data, options = {}) {
    try {
      logger.debug(`Creating ${Model.modelName}`, { data });
      
      const result = await Model.create(data);
      
      logger.dbLog('create', Model.modelName, data, result);
      logger.info(`${Model.modelName} created successfully`, { id: result._id });
      
      return result;
    } catch (error) {
      logger.dbLog('create', Model.modelName, data, null, error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || 'field';
        throw new DatabaseError(`${Model.modelName} with this ${field} already exists`, 'create');
      }
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        throw new DatabaseError(`Validation failed: ${validationErrors.join(', ')}`, 'create');
      }
      
      throw new DatabaseError(`Failed to create ${Model.modelName}`, 'create');
    }
  }

  static async updateById(Model, id, update, options = {}) {
    try {
      logger.debug(`Updating ${Model.modelName} by ID`, { id, update });
      
      const defaultOptions = { new: true, runValidators: true, ...options };
      const result = await Model.findByIdAndUpdate(id, update, defaultOptions);
      
      logger.dbLog('updateById', Model.modelName, { id, update }, result);
      
      if (!result && options.throwIfNotFound) {
        throw new DatabaseError(`${Model.modelName} not found with ID: ${id}`);
      }
      
      if (result) {
        logger.info(`${Model.modelName} updated successfully`, { id });
      }
      
      return result;
    } catch (error) {
      logger.dbLog('updateById', Model.modelName, { id, update }, null, error);
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError(`Failed to update ${Model.modelName}`, 'updateById');
    }
  }

  static async updateOne(Model, query, update, options = {}) {
    try {
      logger.debug(`Updating one ${Model.modelName}`, { query, update });
      
      const defaultOptions = { runValidators: true, ...options };
      const result = await Model.updateOne(query, update, defaultOptions);
      
      logger.dbLog('updateOne', Model.modelName, { query, update }, result);
      logger.info(`${Model.modelName} update completed`, { modifiedCount: result.modifiedCount });
      
      return result;
    } catch (error) {
      logger.dbLog('updateOne', Model.modelName, { query, update }, null, error);
      throw new DatabaseError(`Failed to update ${Model.modelName}`, 'updateOne');
    }
  }

  static async deleteById(Model, id, options = {}) {
    try {
      logger.debug(`Deleting ${Model.modelName} by ID`, { id });
      
      const result = await Model.findByIdAndDelete(id);
      
      logger.dbLog('deleteById', Model.modelName, { id }, result);
      
      if (!result && options.throwIfNotFound) {
        throw new DatabaseError(`${Model.modelName} not found with ID: ${id}`);
      }
      
      if (result) {
        logger.info(`${Model.modelName} deleted successfully`, { id });
      }
      
      return result;
    } catch (error) {
      logger.dbLog('deleteById', Model.modelName, { id }, null, error);
      
      if (error instanceof DatabaseError) {
        throw error;
      }
      
      throw new DatabaseError(`Failed to delete ${Model.modelName}`, 'deleteById');
    }
  }

  static async aggregate(Model, pipeline, options = {}) {
    try {
      logger.debug(`Aggregating ${Model.modelName}`, { pipeline });
      
      const result = await Model.aggregate(pipeline, options);
      
      logger.dbLog('aggregate', Model.modelName, { pipeline }, result);
      
      return result;
    } catch (error) {
      logger.dbLog('aggregate', Model.modelName, { pipeline }, null, error);
      throw new DatabaseError(`Failed to aggregate ${Model.modelName}`, 'aggregate');
    }
  }

  static async countDocuments(Model, query = {}) {
    try {
      logger.debug(`Counting ${Model.modelName} documents`, { query });
      
      const result = await Model.countDocuments(query);
      
      logger.dbLog('countDocuments', Model.modelName, query, result);
      
      return result;
    } catch (error) {
      logger.dbLog('countDocuments', Model.modelName, query, null, error);
      throw new DatabaseError(`Failed to count ${Model.modelName} documents`, 'countDocuments');
    }
  }

  static async transaction(operations) {
    const session = await mongoose.startSession();
    
    try {
      logger.debug('Starting database transaction');
      
      const result = await session.withTransaction(async () => {
        return await operations(session);
      });
      
      logger.info('Database transaction completed successfully');
      return result;
      
    } catch (error) {
      logger.error('Database transaction failed', { error: error.message });
      throw new DatabaseError('Transaction failed', 'transaction');
    } finally {
      await session.endSession();
    }
  }
}

export default DatabaseUtil;
