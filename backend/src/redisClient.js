// src/redisClient.js
import { createClient } from 'redis';
import { REDIS_URL } from '../config/server.js';
import { logInfo, logError, logWarn } from './utils/logger.js';

const url = REDIS_URL || 'redis://localhost:6379';

let client = null;
let isConnecting = false;

function createRedisClient() {
	const c = createClient({
		url,
		socket: {
			reconnectStrategy: retries => {
				if (retries > 10) {
					logError('Redis max reconnection attempts reached');
					return new Error('Max reconnection attempts reached');
				}
				const delay = Math.min(retries * 100, 3000);
				logWarn(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
				return delay;
			},
		},
	});

	c.on('error', err => {
		logWarn(`Redis Client Error: ${err.message}`);
	});

	c.on('connect', () => logInfo('Redis connecting...'));
	c.on('ready', () => {
		logInfo('Redis ready');
		isConnecting = false;
	});
	c.on('reconnecting', () => logWarn('Redis reconnecting...'));
	c.on('end', () => logInfo('Redis connection closed'));

	return c;
}

async function initializeRedis() {
	if (!REDIS_URL) {
		logInfo('Redis not configured - running without Redis');
		return null;
	}

	if (process.env.NODE_ENV === 'dev') {
		if (!global.__redisClient) {
			global.__redisClient = createRedisClient();
			isConnecting = true;
			try {
				await global.__redisClient.connect();
			} catch (err) {
				logWarn('Redis connection failed - continuing without Redis');
			}
		}
		return global.__redisClient;
	}
	const newClient = createRedisClient();
	isConnecting = true;
	try {
		await newClient.connect();
	} catch (err) {
		logWarn('Redis connection failed - continuing without Redis');
	}
	return newClient;
}

// Initialize client
client = await initializeRedis();

// Helper function to safely execute Redis operations
export async function safeRedisGet(key) {
	if (!client || !client.isReady) return null;
	try {
		// console.log('key ==> ', key);
		const value = await client.get(key);
		// console.log('value ==> ', value);
		return value;
	} catch (error) {
		logError(`Redis GET error for key ${key}: ${error.message}`);
		return null;
	}
}

export async function safeRedisSet(key, value, options = {}) {
	if (!client || !client.isReady) return false;
	try {
		await client.set(key, value, options);
		return true;
	} catch (error) {
		logError(`Redis SET error for key ${key}: ${error.message}`);
		return false;
	}
}

export async function safeRedisDel(key) {
	if (!client || !client.isReady) return false;
	try {
		await client.del(key);
		return true;
	} catch (error) {
		logError(`Redis DEL error for key ${key}: ${error.message}`);
		return false;
	}
}

// Scan and delete keys matching pattern (using SCAN instead of KEYS for production safety)
export async function safeRedisScanDel(pattern) {
	if (!client || !client.isReady) return false;
	try {
		let cursor = 0;
		let totalDeleted = 0;

		do {
			const result = await client.scan(cursor, { MATCH: pattern, COUNT: 100 });
			cursor = result.cursor;
			const keys = result.keys;

			if (keys.length > 0) {
				await client.del(keys);
				totalDeleted += keys.length;
			}
		} while (cursor !== 0);

		if (totalDeleted > 0) {
			logInfo(`Deleted ${totalDeleted} keys matching pattern: ${pattern}`);
		} else {
			logInfo(`No keys found matching pattern: ${pattern}`);
		}
		return true;
	} catch (error) {
		logError(`Redis SCAN/DEL error for pattern ${pattern}: ${error.message}`);
		return false;
	}
}

// Check if Redis is ready
export function isRedisReady() {
	return client && client.isReady;
}

// Graceful shutdown
export async function closeRedis() {
	if (client && client.isOpen) {
		await client.quit();
		logInfo('Redis connection closed gracefully');
	}
}

export default client;
