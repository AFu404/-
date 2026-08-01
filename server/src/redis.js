import { createClient } from 'redis';
import { config } from './config.js';

let clientPromise;

async function getClient() {
  if (!config.redisUrl) return null;
  if (!clientPromise) {
    const client = createClient({ url: config.redisUrl });
    client.on('error', (err) => {
      if (config.env !== 'production') console.warn('[redis]', err.message);
    });
    clientPromise = client.connect().then(() => client);
  }
  return clientPromise;
}

export async function withRedis(fn) {
  try {
    const client = await getClient();
    if (!client) return null;
    return await fn(client);
  } catch {
    return null;
  }
}
