import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
  // GET /status
  static getStatus(req, res) {
    const status = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    res.status(200).json(status);
  }

  // GET /stats
  static async getStats(req, res) {
    try {
      const usersCount = await dbClient.nbUsers();
      const filesCount = await dbClient.nbFiles();

      const stats = {
        usersCount,
        filesCount,
      };

      res.status(200).json(stats);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      res.status(500).json({ error: 'Failed to retrieve stats' });
    }
  }
}

export default AppController;
