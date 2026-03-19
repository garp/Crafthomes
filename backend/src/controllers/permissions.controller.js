import { asyncHandler } from '../utils/asyncHandler.js';
import { errorHandler, responseHandler } from '../utils/responseHandler.js';
import RoleServices from '../services/modelServices/roles.services.js';
import PermissionServices from '../services/modelServices/permissions.services.js';
import PermissionCacheService from '../services/permissionCache.service.js';

class PermissionController {
	create = asyncHandler(async (req, res) => {
		const { roleId, name, group, description, endpoint, method } = req.body;
		const role = await RoleServices.findOne({
			where: {
				id: roleId,
			},
		});
		if (!role) return errorHandler('E-200', res);

		// Normalize endpoint before storing
		const normalizedEndpoint = PermissionCacheService.normalizeEndpoint(endpoint);

		const existingPermission = await PermissionServices.findFirst({
			where: {
				name,
				group,
				roleId,
				endpoint: normalizedEndpoint,
				method,
			},
		});
		if (existingPermission) return errorHandler('E-201', res);
		const permission = await PermissionServices.create({
			data: {
				name,
				group,
				description,
				endpoint: normalizedEndpoint,
				method,
				roleId,
			},
		});

		// Invalidate cache after creating permission
		await PermissionCacheService.invalidatePermission(roleId, normalizedEndpoint, method);

		return responseHandler(permission, res);
	});

	createMany = asyncHandler(async (req, res) => {
		const { permissions } = req.body;

		const createdPermissions = [];
		const errors = [];

		for (let i = 0; i < permissions.length; i++) {
			const { roleId, name, group, description, endpoint, method } = permissions[i];

			try {
				// Validate role exists
				const role = await RoleServices.findOne({
					where: { id: roleId },
				});
				if (!role) {
					errors.push({
						index: i,
						permission: permissions[i],
						error: `Role not found for roleId: ${roleId}`,
					});
					continue;
				}

				// Normalize endpoint before storing
				const normalizedEndpoint = PermissionCacheService.normalizeEndpoint(endpoint);

				// Check if permission already exists
				const existingPermission = await PermissionServices.findFirst({
					where: {
						name,
						group,
						roleId,
						endpoint: normalizedEndpoint,
						method,
					},
				});

				if (existingPermission) {
					errors.push({
						index: i,
						permission: permissions[i],
						error: 'Permission already exists',
					});
					continue;
				}

				// Create permission
				const permission = await PermissionServices.create({
					data: {
						name,
						group,
						description,
						endpoint: normalizedEndpoint,
						method,
						roleId,
					},
				});

				createdPermissions.push(permission);

				// Invalidate cache after creating permission
				await PermissionCacheService.invalidatePermission(roleId, normalizedEndpoint, method);
			} catch (error) {
				errors.push({
					index: i,
					permission: permissions[i],
					error: error.message,
				});
			}
		}

		return responseHandler(
			{
				created: createdPermissions.length,
				failed: errors.length,
				createdPermissions,
				errors: errors.length > 0 ? errors : undefined,
			},
			res
		);
	});

	get = asyncHandler(async (req, res) => {
		const { roleId, group, endpoint, method, roleName, id } = req.query;
		const where = {};
		if (roleId) where.roleId = roleId;
		if (group) where.group = group;
		if (endpoint) where.endpoint = { equals: endpoint, mode: 'insensitive' };
		if (method) where.method = method;
		if (roleName) where.role = { name: { equals: roleName, mode: 'insensitive' } };
		if (id) where.id = id;

		const totalCount = await PermissionServices.count({ where });
		const permissions = await PermissionServices.findMany({
			where,
			select: {
				id: true,
				name: true,
				group: true,
				description: true,
				endpoint: true,
				method: true,
				// roleId: true,
				// sNo: true,
				role: {
					select: {
						name: true,
						active: true,
					},
				},
			},
			orderBy: {
				sNo: 'asc',
			},
		});
		return responseHandler({ permissions, totalCount }, res);
	});

	update = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { name, group, description, endpoint, method, roleId } = req.body;

		// Get old permission to invalidate old cache
		const oldPermission = await PermissionServices.findOne({ where: { id } });

		// Normalize endpoint before storing
		const normalizedEndpoint = endpoint ? PermissionCacheService.normalizeEndpoint(endpoint) : undefined;

		const permission = await PermissionServices.update({
			where: { id },
			data: { name, group, description, endpoint: normalizedEndpoint, method, roleId },
		});

		// Invalidate old and new cache entries
		if (oldPermission) {
			await PermissionCacheService.invalidatePermission(oldPermission.roleId, oldPermission.endpoint, oldPermission.method);
		}
		if (roleId && normalizedEndpoint && method) {
			await PermissionCacheService.invalidatePermission(roleId, normalizedEndpoint, method);
		}

		return responseHandler(permission, res);
	});

	updateStatus = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const permission = await PermissionServices.findOne({ where: { id } });
		if (!permission) return errorHandler('E-200', res);
		const updatedPermission = await PermissionServices.update({
			where: { id },
			data: { status: permission.status !== true },
		});

		// Invalidate cache when status changes
		if (permission) {
			await PermissionCacheService.invalidatePermission(permission.roleId, permission.endpoint, permission.method);
		}

		return responseHandler(updatedPermission, res);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;

		// Get permission before deletion to invalidate cache
		const permission = await PermissionServices.findOne({ where: { id } });

		if (!permission) return errorHandler('E-200', res);

		await PermissionServices.delete({ where: { id } });

		// Invalidate cache
		await PermissionCacheService.invalidatePermission(permission.roleId, permission.endpoint, permission.method);

		return responseHandler({ message: 'Permission deleted successfully' }, res);
	});

	clearCache = asyncHandler(async (req, res) => {
		await PermissionCacheService.clearAllPermissions();
		return responseHandler(null, res, 200);
	});

	/**
	 * Bulk update permissions for a specific role - OPTIMIZED VERSION
	 * PUT /api/v1/permissions/role/:roleId
	 *
	 * Request body:
	 * {
	 *   permissions: [
	 *     { endpoint: '/api/v1/users', method: 'GET', enabled: true, name: 'view_users', displayName: 'View Users', group: 'User Management' },
	 *     { endpoint: '/api/v1/users', method: 'POST', enabled: false, name: 'create_user', displayName: 'Create User', group: 'User Management' },
	 *   ]
	 * }
	 */
	updateRolePermissions = asyncHandler(async (req, res) => {
		const { id: roleId } = req.params;
		const { permissions } = req.body;

		// Validate role exists
		const role = await RoleServices.findOne({ where: { id: roleId } });
		if (!role) return errorHandler('E-200', res);

		// Normalize all endpoints upfront
		const normalizedPermissions = permissions.map((perm) => ({
			...perm,
			normalizedEndpoint: PermissionCacheService.normalizeEndpoint(perm.endpoint),
		}));

		// Separate enabled and disabled permissions
		const toEnable = normalizedPermissions.filter((p) => p.enabled);
		const toDisable = normalizedPermissions.filter((p) => !p.enabled);

		// Fetch all existing permissions for this role in one query
		const existingPermissions = await PermissionServices.findMany({
			where: { roleId },
			select: {
				id: true,
				endpoint: true,
				method: true,
				status: true,
			},
		});

		// Create a map for quick lookup: "endpoint:method" -> permission
		const existingMap = new Map();
		existingPermissions.forEach((p) => {
			existingMap.set(`${p.endpoint}:${p.method}`, p);
		});

		const results = {
			created: 0,
			deleted: 0,
			errors: [],
		};

		// Batch create: permissions that should be enabled but don't exist
		const toCreate = [];
		for (const perm of toEnable) {
			const key = `${perm.normalizedEndpoint}:${perm.method}`;
			const existing = existingMap.get(key);

			if (!existing) {
				toCreate.push({
					roleId,
					endpoint: perm.normalizedEndpoint,
					method: perm.method,
					name: perm.name || `${perm.method.toLowerCase()}_${perm.normalizedEndpoint.replace(/[^a-zA-Z0-9]/g, '_')}`,
					displayName: perm.displayName || `${perm.method} ${perm.normalizedEndpoint}`,
					group: perm.group || 'General',
					description: perm.description || null,
					status: 'ACTIVE',
				});
			} else if (existing.status !== 'ACTIVE') {
				// Reactivate - will be handled separately
				toCreate.push({
					_updateId: existing.id,
					status: 'ACTIVE',
				});
			}
		}

		// Batch delete: permissions that should be disabled and exist
		const toDeleteIds = [];
		for (const perm of toDisable) {
			const key = `${perm.normalizedEndpoint}:${perm.method}`;
			const existing = existingMap.get(key);
			if (existing) {
				toDeleteIds.push(existing.id);
			}
		}

		// Execute batch operations
		try {
			// Batch create new permissions
			const newPermissions = toCreate.filter((p) => !p._updateId);
			if (newPermissions.length > 0) {
				await PermissionServices.createMany({
					data: newPermissions,
					skipDuplicates: true,
				});
				results.created += newPermissions.length;
			}

			// Batch update reactivated permissions
			const reactivateIds = toCreate.filter((p) => p._updateId).map((p) => p._updateId);
			if (reactivateIds.length > 0) {
				await PermissionServices.updateMany({
					where: { id: { in: reactivateIds } },
					data: { status: 'ACTIVE' },
				});
				results.created += reactivateIds.length;
			}

			// Batch delete permissions
			if (toDeleteIds.length > 0) {
				await PermissionServices.deleteMany({
					where: { id: { in: toDeleteIds } },
				});
				results.deleted += toDeleteIds.length;
			}
		} catch (error) {
			results.errors.push({
				error: error.message,
			});
		}

		// Invalidate all permissions for this role
		await PermissionCacheService.invalidateRolePermissions(roleId);

		return responseHandler(
			{
				roleId,
				created: results.created,
				deleted: results.deleted,
				errors: results.errors.length > 0 ? results.errors : undefined,
			},
			res
		);
	});

	/**
	 * Get all permissions for a specific role
	 * GET /api/v1/permissions/role/:roleId
	 */
	getRolePermissions = asyncHandler(async (req, res) => {
		const { id: roleId } = req.params;

		// Validate role exists
		const role = await RoleServices.findOne({ where: { id: roleId } });
		if (!role) return errorHandler('E-200', res);

		const permissions = await PermissionServices.findMany({
			where: { roleId, status: 'ACTIVE' },
			select: {
				id: true,
				name: true,
				displayName: true,
				group: true,
				description: true,
				endpoint: true,
				method: true,
				status: true,
			},
			orderBy: [{ group: 'asc' }, { endpoint: 'asc' }, { method: 'asc' }],
		});

		return responseHandler({ roleId, roleName: role.name, permissions }, res);
	});
}

export default new PermissionController();
