import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient();
    
    // Log any Redis client errors
    this.client.on('error', (err) => console.error(`Redis Client Error: ${err}`));

    // Connect the Redis client
    this.client.connect().catch((err) => console.error(`Failed to connect to Redis: ${err}`));
  }

  // Check if the Redis client is alive (connected)
  isAlive() {
    return this.client.isOpen;
  }

  // Get a value from Redis by key
  async get(key) {
    try {
      const value = await this.client.get(key);
      return value;
    } catch (err) {
      console.error(`Failed to get key ${key} from Redis: ${err}`);
      return null;
    }
  }

  // Set a value in Redis with an expiration duration (in seconds)
  async set(key, value, duration) {
    try {
      await this.client.set(key, value, {
        EX: duration,
      });
    } catch (err) {
      console.error(`Failed to set key ${key} in Redis: ${err}`);
    }
  }

  // Delete a value from Redis by key
  async del(key) {
    try {
      await this.client.del(key);
    } catch (err) {
      console.error(`Failed to delete key ${key} from Redis: ${err}`);
    }
  }
}

// Create and export an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;
