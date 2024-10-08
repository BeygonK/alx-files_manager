// class to connect to MongoDB
import { MongoClient } from 'mongodb';

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${host}:${port}`;
class DBClient {
  constructor() {
    this.db = null;
    MongoClient.connect(url, { useUnifiedTopology: true }, (error, client) => {
      if (error) console.log(error);
      this.db = client.db(database);
      this.db.createCollection('users');
      this.db.createCollection('files');
    });
  }

  // check connection status
  isAlive() {
    return !!this.db;
  }

  // Get number of user in 'users' collection
  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  // get number of files in 'files' collection
  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }
}
const dbClient = new DBClient();

export default dbClient;
