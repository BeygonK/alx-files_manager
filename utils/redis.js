import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient();

    this.client.on('error', (err) => {
      console.error(`Error connecting to Redis: ${err}`);
    });

    this.client.connect().catch((err) => {
      console.error('Failed to connect to redis:', err)
    })
  }

  isAlive() {
    return this.client.isOpen;
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value;
    } catch (err) {
      console.error(`Error getting key ${key}: ${err}`);
      return null;
    }
  }

  async set(key, value, duration) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.set(key, stringValue, {
        EX: duration,
      });
    } catch (err) {
      console.error(`Error setting key ${key}: ${err}`);
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (err) {
      console.error(`Error deleting key ${key}: ${err}`);
    }
  }
}

const redisClient = new RedisClient();

export default redisClient;
