import jwt from 'jsonwebtoken';
import { JWT } from '../../config/server.js';
import { errorHandler } from '../utils/responseHandler.js';
import UserServices from '../services/modelServices/user.services.js';
import PermissionCacheService from '../services/permissionCache.service.js';
import PermissionServices from '../services/modelServices/permissions.services.js';
import { logWarn } from '../utils/logger.js';

// Endpoints that any authenticated user can access without explicit permissions.
// These are common operations that every logged-in user needs.
const PUBLIC_ENDPOINTS = [
	{ endpoint: '/api/v1/notifications', method: 'GET' },
	{ endpoint: '/api/v1/notifications/count', method: 'GET' },
	{ endpoint: '/api/v1/notifications/read-all', method: 'PUT' },
	{ endpoint: '/api/v1/notifications/:id/read', method: 'PUT' },
	{ endpoint: '/api/v1/users/me', method: 'GET' },
	{ endpoint: '/api/v1/module-access/definitions', method: 'GET' },
];

/**
 * Check if a request matches a public endpoint pattern.
 * Supports :id placeholders in patterns.
 */
const isPublicEndpoint = (requestEndpoint, requestMethod) => {
	return PUBLIC_ENDPOINTS.some((pe) => {
		if (pe.method !== requestMethod) return false;
		// Convert pattern like /api/v1/notifications/:id/read to regex
		const pattern = pe.endpoint.replace(/:[\w]+/g, '[^/]+');
		const regex = new RegExp(`^${pattern}$`);
		return regex.test(requestEndpoint);
	});
};

const checkPermission = () => {
	return async (req, res, next) => {
		try {
			let token = req.headers.authorization;
			if (!token) return errorHandler('E-006', res);
			if (token.includes('Bearer')) token = token.substring(7);
			const request = {
				endpoint: req.originalUrl.split('?')[0],
				method: req.method,
			};
			const decoded = jwt.verify(token, JWT.ACCESS_SECRET);
			if (!decoded?.id) {
				return errorHandler('E-003', res);
			}
			const { id } = decoded;
			const user = await UserServices.findOne({
				where: { id },
				select: {
					id: true,
					email: true,
					role: true,
					roleId: true,
					userType: true,
					lastActive: true,
					designationId: true,
					designation: {
						select: {
							id: true,
							name: true,
							displayName: true,
						},
					},
				},
			});
			if (!user) {
				return errorHandler('E-104', res);
			}

			// Fire-and-forget: Update lastActive if older than 1 minute (non-blocking)
			const oneMinuteAgo = Date.now() - 1 * 60 * 1000;
			if (!user.lastActive || new Date(user.lastActive).getTime() < oneMinuteAgo) {
				UserServices.update({
					where: { id },
					data: { lastActive: new Date() },
				}).catch(() => {}); // Silently ignore errors
			}

		// Super admin bypass - always allowed
		if (user.role?.name === 'super_admin') {
			req.user = {
				userId: user.id,
				email: user.email,
				role: user.role,
				roleId: user.roleId,
				userType: user.userType,
				designationId: user.designationId,
				designation: user.designation,
			};
			return next();
		}

		// Public endpoints - any authenticated user can access
		if (isPublicEndpoint(request.endpoint, request.method)) {
			req.user = {
				userId: user.id,
				email: user.email,
				role: user.role,
				roleId: user.roleId,
				userType: user.userType,
				designationId: user.designationId,
				designation: user.designation,
			};
			return next();
		}

		// Database-driven RBAC with Redis caching
			// Try Redis-cached permission check first (by roleId + normalized endpoint + method)
			let permissions = await PermissionCacheService.getPermissions(
				user.roleId,
				request.endpoint,
				request.method
			);

			// Fallback: If not found in Redis, check database directly
			if (permissions === null) {
				logWarn(`Permission not found in Redis cache, checking database directly`);
				const normalizedEndpoint = PermissionCacheService.normalizeEndpoint(request.endpoint);
				const dbPermissions = await PermissionServices.findMany({
					where: {
						roleId: user.roleId,
						endpoint: normalizedEndpoint,
						method: request.method,
						status: 'ACTIVE',
					},
				});
				// Write-back cache so next request hits Redis (also caches negative result as empty array)
				await PermissionCacheService.cachePermissions(
					user.roleId,
					request.endpoint,
					request.method,
					dbPermissions
				);
				permissions = dbPermissions && dbPermissions.length > 0 ? dbPermissions : null;
			}

			// Deny by default: If no permission found, deny access
			if (!permissions) {
				return errorHandler('E-007', res);
			}

			req.user = {
				userId: user.id,
				email: user.email,
				role: user.role,
				roleId: user.roleId,
				userType: user.userType,
				designationId: user.designationId,
				designation: user.designation,
			};

			return next();
		} catch (err) {
			console.error('Permission error:', err);
			return errorHandler('E-003', res);
		}
	};
};

export default checkPermission;
