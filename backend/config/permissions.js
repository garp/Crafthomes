/**
 * Route permissions (RBAC) config.
 *
 * This is intentionally similar to `dummy-permissions.js`:
 * - Keys are `METHOD:/api/v1/...` with `/:id` placeholders for dynamic segments
 * - Values are an allowlist of role names
 *
 * Behavior (see `isRouteAllowed` below):
 * - `super_admin` is always allowed
 * - If a route key exists in `ROUTE_PERMISSIONS`, it is enforced (deny if role not allowed)
 * - If a route key does NOT exist, it is allowed (so you can add rules incrementally)
 *
 * If you want stricter security (deny-by-default), flip `DEFAULT_ALLOW_IF_UNDEFINED` to false.
 */

export const ROLES = Object.freeze({
	SUPER_ADMIN: 'super_admin',
	ADMIN: 'admin',
	INTERNAL_USER: 'internal_user',
	CLIENT: 'client',
	CLIENT_CONTACT: 'client_contact',
	VENDOR: 'vendor',
	VENDOR_CONTACT: 'vendor_contact',
});

export const INTERNAL_ROLES = Object.freeze([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INTERNAL_USER]);
export const EXTERNAL_ROLES = Object.freeze([
	ROLES.CLIENT,
	ROLES.CLIENT_CONTACT,
	ROLES.VENDOR,
	ROLES.VENDOR_CONTACT,
]);
export const ALL_ROLES = Object.freeze([...INTERNAL_ROLES, ...EXTERNAL_ROLES]);

// Incremental rollout behavior:
// - Internal roles: allow if route is not defined (keeps existing admin flow working)
// - External roles: deny if route is not defined (forces explicit allowlist)
export const DEFAULT_ALLOW_INTERNAL_IF_UNDEFINED = true;
export const DEFAULT_ALLOW_EXTERNAL_IF_UNDEFINED = false;

/**
 * Explicit allowlist per endpoint+method.
 * Add more entries here to restrict access.
 */
export const ROUTE_PERMISSIONS = Object.freeze({
	// ─── Common / Profile ───────────────────────────────
	'GET:/api/v1/users/me': ALL_ROLES,

	// ─── Timesheet (external: NOT accessible) ───────────
	'GET:/api/v1/timesheet': INTERNAL_ROLES,
	'POST:/api/v1/timesheet': INTERNAL_ROLES,
	'POST:/api/v1/timesheet/week/submit': INTERNAL_ROLES,
	'GET:/api/v1/timesheet/approvals': INTERNAL_ROLES,
	'PUT:/api/v1/timesheet/week/:id/decision': INTERNAL_ROLES,
	'PUT:/api/v1/timesheet/:id/decision': INTERNAL_ROLES,
	'GET:/api/v1/timesheet/approvers': [ROLES.SUPER_ADMIN],
	'POST:/api/v1/timesheet/approvers': [ROLES.SUPER_ADMIN],
	'PUT:/api/v1/timesheet/approvers/:id': [ROLES.SUPER_ADMIN],
	'DELETE:/api/v1/timesheet/approvers/:id': [ROLES.SUPER_ADMIN],
	'GET:/api/v1/timesheet/:id': INTERNAL_ROLES,
	'PUT:/api/v1/timesheet/:id': INTERNAL_ROLES,
	'DELETE:/api/v1/timesheet/:id': INTERNAL_ROLES,

	// ─── User management (admin/internal only) ─────────
	'GET:/api/v1/users': INTERNAL_ROLES,
	'POST:/api/v1/users': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
	'PUT:/api/v1/users/:id': INTERNAL_ROLES,
	'DELETE:/api/v1/users/:id': [ROLES.SUPER_ADMIN, ROLES.ADMIN],

	// ─── Internal settings (admin/internal only) ───────
	'GET:/api/v1/settings/internal-users': INTERNAL_ROLES,
	'POST:/api/v1/settings/internal-users': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
	'PUT:/api/v1/settings/internal-users/:id': INTERNAL_ROLES,
	'DELETE:/api/v1/settings/internal-users/:id': [ROLES.SUPER_ADMIN, ROLES.ADMIN],

	// ─── Roles & Permissions (admin/internal only) ─────
	'GET:/api/v1/roles': INTERNAL_ROLES,
	'POST:/api/v1/roles': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
	'PUT:/api/v1/roles/:id': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
	'PUT:/api/v1/roles/status/:id': [ROLES.SUPER_ADMIN, ROLES.ADMIN],

	'GET:/api/v1/permissions': INTERNAL_ROLES,
	'POST:/api/v1/permissions': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
	'POST:/api/v1/permissions/bulk': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
	'PUT:/api/v1/permissions/:id': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
	'DELETE:/api/v1/permissions/:id': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
	'PATCH:/api/v1/permissions/status/:id': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
	'GET:/api/v1/permissions/clear-cache': [ROLES.SUPER_ADMIN, ROLES.ADMIN],

	// ─── Master data (admin/internal only) ─────────────
	'GET:/api/v1/masterPhase': INTERNAL_ROLES,
	'POST:/api/v1/masterPhase': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
	'PUT:/api/v1/masterPhase/:id': INTERNAL_ROLES,
	'DELETE:/api/v1/masterPhase/:id': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
	'DELETE:/api/v1/masterPhase/bulk': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
	'GET:/api/v1/masterPhase/project-type/:id': INTERNAL_ROLES,

	'GET:/api/v1/masterTask': INTERNAL_ROLES,
	'POST:/api/v1/masterTask': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
	'PUT:/api/v1/masterTask/:id': INTERNAL_ROLES,
	'DELETE:/api/v1/masterTask/:id': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
	'DELETE:/api/v1/masterTask/bulk': [ROLES.SUPER_ADMIN, ROLES.ADMIN],

	'GET:/api/v1/masterItem': INTERNAL_ROLES,
	'POST:/api/v1/masterItem': [ROLES.SUPER_ADMIN, ROLES.ADMIN],
	'PUT:/api/v1/masterItem/:id': INTERNAL_ROLES,
	'DELETE:/api/v1/masterItem/:id': [ROLES.SUPER_ADMIN, ROLES.ADMIN],

	// ─── External access allowlist (per your request) ───
	// Project: GET endpoints
	'GET:/api/v1/project': ALL_ROLES,
	'GET:/api/v1/project/summary/:id': ALL_ROLES,
	'GET:/api/v1/project/users/assigned-list/:id': ALL_ROLES,
	'GET:/api/v1/project/linked-data/:id': ALL_ROLES,

	// Task: ALL endpoints
	'GET:/api/v1/task': ALL_ROLES,
	'POST:/api/v1/task': ALL_ROLES,
	'PUT:/api/v1/task/:id': ALL_ROLES,
	'DELETE:/api/v1/task/:id': ALL_ROLES,
	'PUT:/api/v1/task/mark-complete/:id': ALL_ROLES,

	// Phase: ALL endpoints
	'GET:/api/v1/phase': ALL_ROLES,
	'POST:/api/v1/phase': ALL_ROLES,
	'PUT:/api/v1/phase/:id': ALL_ROLES,
	'DELETE:/api/v1/phase/:id': ALL_ROLES,

	// Client: GET endpoint
	'GET:/api/v1/client': ALL_ROLES,

	// project-type, project-type-group: GET endpoints
	'GET:/api/v1/project-type': ALL_ROLES,
	'GET:/api/v1/project-type/:id': ALL_ROLES,
	'GET:/api/v1/project-type-group': ALL_ROLES,
	'GET:/api/v1/project-type-group/:id': ALL_ROLES,

	// masterPhase, masterTask: GET endpoints
	'GET:/api/v1/masterPhase': ALL_ROLES,
	'GET:/api/v1/masterPhase/project-type/:id': ALL_ROLES,
	'GET:/api/v1/masterTask': ALL_ROLES,

	// Policy (under settings): GET endpoints
	'GET:/api/v1/settings/policy': ALL_ROLES,
	'GET:/api/v1/settings/policy/:id': ALL_ROLES,

	// MasterItem: GET endpoint
	'GET:/api/v1/masterItem': ALL_ROLES,

	// Quotation: GET endpoint
	'GET:/api/v1/quotations': ALL_ROLES,

	// Files: GET endpoints
	'GET:/api/v1/file-manager': ALL_ROLES,
	'GET:/api/v1/file-manager/folder/:id': ALL_ROLES,
	'GET:/api/v1/file-manager/file/:id': ALL_ROLES,
	'GET:/api/v1/file-manager/folders': ALL_ROLES,
	'GET:/api/v1/file-manager/file': ALL_ROLES,

	// Timelines: GET endpoints
	'GET:/api/v1/timeline': ALL_ROLES,
	'GET:/api/v1/timeline/phase': ALL_ROLES,
	'GET:/api/v1/timeline/task': ALL_ROLES,
	'GET:/api/v1/timeline/ordered-tasks': ALL_ROLES,
	'GET:/api/v1/timeline/:id': ALL_ROLES,

	// MOM: GET endpoints
	'GET:/api/v1/mom': ALL_ROLES,
	'GET:/api/v1/mom/:id': ALL_ROLES,

	// Payment: GET endpoints
	'GET:/api/v1/payment': ALL_ROLES,

	// Snag: GET endpoints
	'GET:/api/v1/snag': ALL_ROLES,
	'GET:/api/v1/snag/:id': ALL_ROLES,
});

// Keep default export for backwards compatibility/import style
export default ROUTE_PERMISSIONS;

/**
 * Normalize an incoming request endpoint to match permission keys.
 * Mirrors the normalization in `PermissionCacheService.normalizeEndpoint`.
 */
export function normalizeEndpoint(endpoint) {
	return endpoint
		.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
		.replace(/\/\d+/g, '/:id')
		.replace(/\/$/, '');
}

/**
 * Check if `roleName` is allowed to access given request.
 */
export function isRouteAllowed({ roleName, method, endpoint }) {
	if (!roleName || !method || !endpoint) return false;
	if (roleName === ROLES.SUPER_ADMIN) return true;

	const normalized = normalizeEndpoint(endpoint);
	const key = `${method.toUpperCase()}:${normalized}`;

	const allowedRoles = ROUTE_PERMISSIONS[key];
	if (!allowedRoles) {
		const isInternal = INTERNAL_ROLES.includes(roleName);
		return isInternal ? DEFAULT_ALLOW_INTERNAL_IF_UNDEFINED : DEFAULT_ALLOW_EXTERNAL_IF_UNDEFINED;
	}

	return allowedRoles.includes(roleName);
}
