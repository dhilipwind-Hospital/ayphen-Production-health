import { AppDataSource } from '../../config/database';

module.exports = async () => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  } catch {}
};
