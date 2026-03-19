import { asyncHandler } from '../utils/asyncHandler.js';
import { errorHandler, responseHandler } from '../utils/responseHandler.js';
import ModuleAccessServices from '../services/modelServices/moduleAccess.services.js';
import ModuleAccessCacheService from '../services/moduleAccessCache.service.js';
import RoleServices from '../services/modelServices/roles.services.js';

/**
 * Full registry of all available modules in the application.
 * topLevel  = Main sidebar items
 * typeLevel = Sub-navigation within a topLevel (project sub-pages, settings tabs)
 */
const MODULE_DEFINITIONS = [
	// Top-level modules (main sidebar items)
	{ topLevel: 'summary', typeLevel: null, subtypeLevel: null, displayName: 'Summary' },
	{ topLevel: 'projects', typeLevel: null, subtypeLevel: null, displayName: 'Projects' },
	{ topLevel: 'allTasks', typeLevel: null, subtypeLevel: null, displayName: 'All Tasks' },
	{ topLevel: 'calendar', typeLevel: null, subtypeLevel: null, displayName: 'Calendar' },
	{ topLevel: 'allLibraries', typeLevel: null, subtypeLevel: null, displayName: 'All Libraries' },
	{ topLevel: 'messages', typeLevel: null, subtypeLevel: null, displayName: 'Messages' },
	{ topLevel: 'clients', typeLevel: null, subtypeLevel: null, displayName: 'Clients' },
	{ topLevel: 'vendors', typeLevel: null, subtypeLevel: null, displayName: 'Vendors' },
	{ topLevel: 'timesheet', typeLevel: null, subtypeLevel: null, displayName: 'Timesheet' },
	{ topLevel: 'settings', typeLevel: null, subtypeLevel: null, displayName: 'Settings' },

	// Project sub-pages (typeLevel under "projects")
	{ topLevel: 'projects', typeLevel: 'projectSummary', subtypeLevel: null, displayName: 'Project Summary' },
	{ topLevel: 'projects', typeLevel: 'quotation', subtypeLevel: null, displayName: 'Quotation' },
	{ topLevel: 'projects', typeLevel: 'files', subtypeLevel: null, displayName: 'Files' },
	{ topLevel: 'projects', typeLevel: 'projectTask', subtypeLevel: null, displayName: 'Task' },
	{ topLevel: 'projects', typeLevel: 'timeline', subtypeLevel: null, displayName: 'Timeline' },
	{ topLevel: 'projects', typeLevel: 'snag', subtypeLevel: null, displayName: 'Snag' },
	{ topLevel: 'projects', typeLevel: 'mom', subtypeLevel: null, displayName: 'MOM' },
	{ topLevel: 'projects', typeLevel: 'payment', subtypeLevel: null, displayName: 'Payment' },
	{ topLevel: 'projects', typeLevel: 'siteVisit', subtypeLevel: null, displayName: 'Site Visit' },

	// Settings tabs (typeLevel under "settings")
	{ topLevel: 'settings', typeLevel: 'users', subtypeLevel: null, displayName: 'User Profiles' },
	{ topLevel: 'settings', typeLevel: 'roles', subtypeLevel: null, displayName: 'Role & Permissions' },
	{ topLevel: 'settings', typeLevel: 'phase', subtypeLevel: null, displayName: 'Phase Management' },
	{ topLevel: 'settings', typeLevel: 'projectSettings', subtypeLevel: null, displayName: 'Project Settings' },
	{ topLevel: 'settings', typeLevel: 'products', subtypeLevel: null, displayName: 'Product Management' },
	{ topLevel: 'settings', typeLevel: 'organization', subtypeLevel: null, displayName: 'Organization' },
	{ topLevel: 'settings', typeLevel: 'integrations', subtypeLevel: null, displayName: 'Integrations' },
];

class ModuleAccessController {
	/**
	 * GET /module-access/definitions
	 * Returns the full registry of available modules (static list).
	 */
	getDefinitions = asyncHandler(async (_req, res) => {
		return responseHandler(MODULE_DEFINITIONS, res);
	});

	/**
	 * GET /module-access?roleId=xxx
	 * Returns module access entries for a specific role (Redis-cached).
	 */
	get = asyncHandler(async (req, res) => {
		const { roleId } = req.query;

		if (!roleId) return errorHandler('E-400', res);

		const role = await RoleServices.findOne({ where: { id: roleId } });
		if (!role) return errorHandler('E-404', res);

		// Use Redis cache for module access
		const moduleAccess = await ModuleAccessCacheService.getModuleAccess(roleId);

		return responseHandler({ roleId, roleName: role.name, moduleAccess }, res);
	});

	/**
	 * PUT /module-access/role/:roleId
	 * Bulk update module access for a role.
	 * Body: { modules: [{ topLevel, typeLevel?, subtypeLevel? }] }
	 *
	 * The provided array is the desired "enabled" set.
	 * Anything not in the list will be deleted. New entries will be created.
	 */
	bulkUpdate = asyncHandler(async (req, res) => {
		const { id: roleId } = req.params;
		const { modules } = req.body;

		// Validate role exists
		const role = await RoleServices.findOne({ where: { id: roleId } });
		if (!role) return errorHandler('E-404', res);

		// Fetch existing module access for this role
		const existing = await ModuleAccessServices.findMany({
			where: { roleId },
			select: { id: true, topLevel: true, typeLevel: true, subtypeLevel: true },
		});

		// Build lookup key
		const makeKey = (m) => `${m.topLevel}::${m.typeLevel || ''}::${m.subtypeLevel || ''}`;

		const existingMap = new Map();
		existing.forEach((e) => existingMap.set(makeKey(e), e));

		const desiredSet = new Set();
		modules.forEach((m) => desiredSet.add(makeKey(m)));

		const results = { created: 0, deleted: 0, errors: [] };

		// Determine what to create (in desired but not existing)
		const toCreate = [];
		for (const mod of modules) {
			const key = makeKey(mod);
			if (!existingMap.has(key)) {
				toCreate.push({
					roleId,
					topLevel: mod.topLevel,
					typeLevel: mod.typeLevel || null,
					subtypeLevel: mod.subtypeLevel || null,
					status: 'ACTIVE',
				});
			}
		}

		// Determine what to delete (in existing but not desired)
		const toDeleteIds = [];
		for (const [key, entry] of existingMap) {
			if (!desiredSet.has(key)) {
				toDeleteIds.push(entry.id);
			}
		}

		try {
			if (toCreate.length > 0) {
				await ModuleAccessServices.createMany({
					data: toCreate,
					skipDuplicates: true,
				});
				results.created = toCreate.length;
			}

			if (toDeleteIds.length > 0) {
				await ModuleAccessServices.deleteMany({
					where: { id: { in: toDeleteIds } },
				});
				results.deleted = toDeleteIds.length;
			}

			// Invalidate Redis cache for this role's module access
			await ModuleAccessCacheService.invalidateRole(roleId);
		} catch (error) {
			results.errors.push({ error: error.message });
		}

		return responseHandler(
			{
				roleId,
				created: results.created,
				deleted: results.deleted,
				errors: results.errors.length > 0 ? results.errors : undefined,
			},
			res,
		);
	});
}

export default new ModuleAccessController();
