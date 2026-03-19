// src/services/moduleAccessCache.service.js
import { safeRedisGet, safeRedisSet, safeRedisDel, safeRedisScanDel } from '../redisClient.js';
import ModuleAccessServices from './modelServices/moduleAccess.services.js';
import { logInfo, logWarn } from '../utils/logger.js';
import { REDIS } from '../../config/server.js';

class ModuleAccessCacheService {
	// Reuse the same TTL as permissions (configurable)
	static MODULE_ACCESS_TTL = REDIS.PERMISSION_CACHE_TTL;

	// Redis key format: modaccess:{roleId}
	static getCacheKey(roleId) {
		return `modaccess:${roleId}`;
	}

	// Pattern to match all module access keys
	static getAllPattern() {
		return 'modaccess:*';
	}

	/**
	 * Get module access for a role from Redis or fallback to DB.
	 * Returns an array of { topLevel, typeLevel, subtypeLevel }.
	 */
	static async getModuleAccess(roleId) {
		const cacheKey = this.getCacheKey(roleId);

		// Try Redis first
		const cached = await safeRedisGet(cacheKey);
		if (cached !== null) {
			logInfo(`Module access cache hit: ${cacheKey}`);
			try {
				return JSON.parse(cached);
			} catch (error) {
				logWarn(`Failed to parse cached module access: ${error.message}`);
				await safeRedisDel(cacheKey);
			}
		}

		// Cache miss - fetch from database
		logInfo(`Module access cache miss, fetching from DB: ${cacheKey}`);
		const moduleAccess = await ModuleAccessServices.findMany({
			where: { roleId, status: 'ACTIVE' },
			select: { topLevel: true, typeLevel: true, subtypeLevel: true },
			orderBy: { sNo: 'asc' },
		});

		const result = moduleAccess || [];

		// Write-back to cache
		await safeRedisSet(cacheKey, JSON.stringify(result), { EX: this.MODULE_ACCESS_TTL });

		return result;
	}

	/**
	 * Invalidate module access cache for a specific role.
	 * Call this after bulk updates to module access.
	 */
	static async invalidateRole(roleId) {
		const cacheKey = this.getCacheKey(roleId);
		await safeRedisDel(cacheKey);
		logInfo(`Invalidated module access cache for role: ${roleId}`);
	}

	/**
	 * Invalidate all module access cache entries.
	 */
	static async clearAll() {
		const pattern = this.getAllPattern();
		const success = await safeRedisScanDel(pattern);
		if (success) {
			logInfo('Cleared all module access cache');
		} else {
			logWarn('Failed to clear all module access cache');
		}
	}
}

export default ModuleAccessCacheService;
