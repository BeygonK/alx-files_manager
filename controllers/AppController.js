import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
  // GET /status
  static async getStatus(req, res) {
    try {
      const status = {
        redis: await redisClient.isAlive(),
        db: await dbClient.isAlive(),
      };
      res.status(200).json(status);
    } catch (err) {
      console.error(`Error checking status: ${err.message}`);
      res.status(500).json({ error: 'Failed to check status' });
    }
  }

  // GET /stats
  static async getStats(req, res) {
    try {
      const usersCount = await dbClient.nbUsers();
      const filesCount = await dbClient.nbFiles();

      const stats = {
        users: usersCount,
        files: filesCount,
      };

      res.status(200).json(stats);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      res.status(500).json({ error: 'Failed to retrieve stats' });
    }
  }
}

export default AppController;
