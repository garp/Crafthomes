// src/services/permissionCache.service.js
import { safeRedisGet, safeRedisSet, safeRedisDel, safeRedisScanDel } from '../redisClient.js';
import PermissionServices from './modelServices/permissions.services.js';
import { logInfo, logWarn } from '../utils/logger.js';
import { REDIS } from '../../config/server.js';

class PermissionCacheService {
	// Use config TTL
	static PERMISSION_TTL = REDIS.PERMISSION_CACHE_TTL;

	// Normalize Endpoint to Route Pattern (remove dynamic IDs)
	static normalizeEndpoint(endpoint) {
		return endpoint
			.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
			.replace(/\/\d+/g, '/:id')
			.replace(/\/$/, ''); // Remove trailing slash
	}

	// Get Redis Cache Key for a Specific Permission
	static getCacheKey(roleId, endpoint, method) {
		const normalizedEndpoint = this.normalizeEndpoint(endpoint);
		return `perm:${roleId}:${normalizedEndpoint}:${method}`;
	}

	// Get Redis Cache Pattern for a Role
	static getRolePattern(roleId) {
		return `perm:${roleId}:*`;
	}

	// Get Permissions from Redis Cache or Database
	static async getPermissions(roleId, endpoint, method) {
		const cacheKey = this.getCacheKey(roleId, endpoint, method);
		const normalizedEndpoint = this.normalizeEndpoint(endpoint);

		// Try to get from cache
		const cached = await safeRedisGet(cacheKey);

		if (cached !== null) {
			logInfo(`Getting permissions from cache: ${cacheKey}`);
			try {
				const parsed = JSON.parse(cached);
				// Return null if permission denied (cached as empty array)
				return parsed.length > 0 ? parsed : null;
			} catch (error) {
				logWarn(`Failed to parse cached permission: ${error.message}`);
				// Delete corrupted cache entry
				await safeRedisDel(cacheKey);
			}
		}

		// Cache miss - fetch from database
		logInfo(`Getting permissions from database: ${cacheKey}`);
		const permissions = await PermissionServices.findMany({
			where: { roleId, endpoint: normalizedEndpoint, method, status: 'ACTIVE' },
		});

		// Adding Permissions to Cache
		const valueToCache = permissions || [];
		await safeRedisSet(cacheKey, JSON.stringify(valueToCache), { EX: this.PERMISSION_TTL });

		// Returning Permissions
		return permissions && permissions.length > 0 ? permissions : null;
	}

	// Save Permissions to Redis Cache (including negative cache as empty array)
	static async cachePermissions(roleId, endpoint, method, permissions) {
		const cacheKey = this.getCacheKey(roleId, endpoint, method);
		const valueToCache = permissions || [];
		await safeRedisSet(cacheKey, JSON.stringify(valueToCache), { EX: this.PERMISSION_TTL });
	}

	// Invalidate Redis Cache for a Specific Permission
	static async invalidatePermission(roleId, endpoint = null, method = null) {
		if (endpoint && method) {
			// Invalidate specific permission
			const normalizedEndpoint = this.normalizeEndpoint(endpoint);
			const cacheKey = this.getCacheKey(roleId, normalizedEndpoint, method);
			await safeRedisDel(cacheKey);
			logInfo(`Invalidated permission cache: ${cacheKey}`);
		} else {
			// Invalidate all permissions for this role
			await this.invalidateRolePermissions(roleId);
		}
	}

	// Invalidate Redis Cache for all Permissions for a Role
	static async invalidateRolePermissions(roleId) {
		const pattern = this.getRolePattern(roleId);
		const success = await safeRedisScanDel(pattern);
		if (success) {
			logInfo(`Invalidated all permissions for role: ${roleId}`);
		} else {
			logWarn(`Failed to invalidate permissions for role: ${roleId}`);
		}
	}

	// Clear Redis Cache for all Permissions
	static async clearAllPermissions() {
		const pattern = 'perm:*';
		const success = await safeRedisScanDel(pattern);
		if (success) {
			logInfo('Cleared all permission cache');
		} else {
			logWarn('Failed to clear all permission cache');
		}
	}
}

export default PermissionCacheService;
