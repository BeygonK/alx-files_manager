import crypto from 'crypto';
import dbClient from '../utils/db';

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

      return res.status(201).json({ id: result.insertedId, email });
    } catch (err) {
      console.error(`Error: ${err.message}`);
      return res.status(500).json({ error: 'Failed to create user' });
    }
  }
}

export default UsersController;
