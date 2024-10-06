import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  // authenticate a user
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;

    // check auth header
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    // extract email and password from auth header
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    // Find user by email and password
    try {
      if (!dbClient.isAlive()) {
        return res.status(500).json({ error: 'MongoDB connection not available' });
      }

      const usersCollection = dbClient.db.collection('users');
      const user = await usersCollection.findOne({ email });

      if (!user || sha1(password) !== user.password) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate a unique token
      const token = uuidv4();
      const key = `auth_${token}`;
      const userId = user._id.toString();

      // Store token in Redis
      await redisClient.set(key, userId, 86400);

      return res.status(200).json({ token });
    } catch (err) {
      console.error(`Error: ${err.message}`);
      return res.status(500).json({ error: 'Failed to authenticate user' });
    }
  }

  // disconnect user
  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }

    const key = `auth_${token}`;
    const result = await redisClient.del(key);

    if (result === 0) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    return res.status(204).send();
  }

  // GET /me
}

module.exports = AuthController;
