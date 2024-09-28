// class to connect to MongoDB
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load env variables
dotenv.config();

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    // create mongo client
    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

    // connect to db
    this.client.connect().then(() => {
      this.db = this.client.db(database);
      console.log(`Connected to MongoDB: ${url}`);
    }).catch((err) => {
      console.error(`Error connecting to MongoDB: ${err}`);
    });
  }

  // check connection status
  isAlive() {
    return this.client && this.client.topology && this.client.topology.isConnected();
  }

  // Get number of user in 'users' collection
  async nbUsers() {
    try {
      const usersCollection = this.db.collection('users');
      const count = await usersCollection.countDocuments();
      return count;
    } catch (err) {
      console.error(`Failed to count users: ${err}`);
      return 0;
    }
  }

  // get number of files in 'files' collection
  async nbFiles() {
    try {
      const filesCollection = this.db.collection('files');
      const count = await filesCollection.countDocuments();
      return count;
    } catch (err) {
      console.error(`Failed to count files: ${err}`);
      return 0;
    }
  }
}

const dbClient = new DBClient();

export default dbClient;
