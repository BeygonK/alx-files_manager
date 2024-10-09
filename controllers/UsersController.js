import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { userQueue } from '../utils/userQueues';
class UsersController {
  // POST /users
  static async postNew(req, res) {
    const { email, password } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      if (!dbClient.isAlive()) {
        return res.status(500).json({ error: 'MongoDB connection not available' });
      }

      const usersCollection = dbClient.db.collection('users');

      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      // Hash password
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

      const newUser = { email, password: hashedPassword };
      const result = await usersCollection.insertOne(newUser);

      userQueue.add({
        userId: result.insertedId,
      });

      return res.status(201).json({ id: result.insertedId, email });
    } catch (err) {
      console.error(`Error: ${err.message}`);
      return res.status(500).json({ error: 'Failed to create user' });
    }
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const redisKey = `auth_${token}`;

    try {
      // Retrieve user ID from Redis
      const userId = await redisClient.get(redisKey);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log(`Getting userid ${userId}`);
      // Find the user by ID

      const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Return user information (email and id only)
      return res.status(200).json({ email: user.email, id: user._id });
    } catch (error) {
      console.error('Error retrieving user information:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default UsersController;
