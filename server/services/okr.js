const OKR = require('../models/okr');
const logger = require('../utils/log');

const log = logger('services/okr');

// Helper function to calculate progress
function calculateProgress(keyResults) {
  if (!keyResults.length) return 0;
  const totalProgress = keyResults.reduce((sum, kr) => sum + ((kr.currentValue / kr.targetValue) * 100), 0);
  return Math.round(totalProgress / keyResults.length);
}

class OKRService {
  static async create(data) {
    try {
      // Validate dates
      if (new Date(data.startDate) >= new Date(data.endDate)) {
        throw new Error('End Date must be greater than Start Date');
      }

      // Calculate progress for each key result before saving
      data.keyResults = data.keyResults.map(kr => ({
        ...kr,
        progress: Math.round((kr.currentValue / kr.targetValue) * 100)
      }));

      // Calculate overall OKR progress
      data.progress = calculateProgress(data.keyResults);
      log.info(`Calculated OKR progress: ${data.progress}`);

      const okr = new OKR(data);
      await okr.save();
      log.info(`OKR created successfully: ${okr._id}`);
      return okr;
    } catch (err) {
      log.error(`Error while creating OKR: ${err.message}`, err);
      throw new Error(`Error while creating OKR: ${err.message}`);
    }
  }

  static async list() {
    try {
      const okrs = await OKR.find();
      log.info(`Retrieved ${okrs.length} OKRs`);
      // Add log to verify OKRs being returned
      okrs.forEach(okr => {
        log.info(`OKR ID: ${okr._id}, Owners: ${okr.owners.join(', ')}`);
      });
      return okrs;
    } catch (err) {
      log.error(`Database error while listing OKRs: ${err.message}`, err);
      throw new Error(`Database error while listing OKRs: ${err.message}`);
    }
  }

  static async get(id) {
    try {
      const okr = await OKR.findById(id);
      if (!okr) {
        log.warn(`OKR not found with ID: ${id}`);
        return null;
      }
      log.info(`OKR retrieved successfully: ${id}`);
      return okr;
    } catch (err) {
      log.error(`Database error while getting OKR by ID: ${err.message}`, err);
      throw new Error(`Database error while getting OKR by ID: ${err.message}`);
    }
  }

  static async update(id, data) {
    try {
      // Validate dates
      if (data.startDate && data.endDate && new Date(data.startDate) >= new Date(data.endDate)) {
        throw new Error('End Date must be greater than Start Date');
      }

      // Calculate progress for each key result before updating
      if (data.keyResults) {
        data.keyResults = data.keyResults.map(kr => ({
          ...kr,
          progress: Math.round((kr.currentValue / kr.targetValue) * 100)
        }));
      }

      // Calculate overall progress
      if (data.keyResults) {
        data.progress = calculateProgress(data.keyResults);
      }

      const okr = await OKR.findByIdAndUpdate(id, data, { new: true });
      if (!okr) {
        log.warn(`OKR not found for update with ID: ${id}`);
        return null;
      }
      log.info(`OKR updated successfully: ${id}`);
      return okr;
    } catch (err) {
      log.error(`Error while updating OKR ${id}: ${err.message}`, err);
      throw new Error(`Error while updating OKR ${id}: ${err.message}`);
    }
  }

  static async delete(id) {
    try {
      const result = await OKR.findByIdAndDelete(id);
      if (!result) {
        log.warn(`OKR not found for deletion with ID: ${id}`);
        return false;
      }
      log.info(`OKR deleted successfully: ${id}`);
      return true;
    } catch (err) {
      log.error(`Database error while deleting OKR ${id}: ${err.message}`, err);
      throw new Error(`Database error while deleting OKR ${id}: ${err.message}`);
    }
  }
}

module.exports = OKRService;