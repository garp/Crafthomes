/**
 * Master list of all API endpoints available for permission management.
 * This configuration is used by the endpoints API to return available routes
 * for the admin permission management UI.
 *
 * Structure:
 * - group: Category name for UI grouping
 * - endpoints: Array of endpoint definitions
 *   - endpoint: Normalized URL pattern (with /:id placeholders)
 *   - method: HTTP method (GET, POST, PUT, DELETE, PATCH)
 *   - name: Unique identifier for the permission
 *   - displayName: Human-readable name for the UI
 *   - description: Optional description
 */

export const ENDPOINT_GROUPS = [
	{
		group: 'User Management',
		endpoints: [
			{ endpoint: '/api/v1/users/me', method: 'GET', name: 'view_own_profile', displayName: 'View Own Profile' },
			{ endpoint: '/api/v1/users', method: 'GET', name: 'view_users', displayName: 'View Users' },
			{ endpoint: '/api/v1/users', method: 'POST', name: 'create_user', displayName: 'Create User' },
			{ endpoint: '/api/v1/users/:id', method: 'PUT', name: 'update_user', displayName: 'Update User' },
			{ endpoint: '/api/v1/users/:id', method: 'DELETE', name: 'delete_user', displayName: 'Delete User' },
		],
	},
	{
		group: 'Internal Users',
		endpoints: [
			{ endpoint: '/api/v1/settings/internal-users', method: 'GET', name: 'view_internal_users', displayName: 'View Internal Users' },
			{ endpoint: '/api/v1/settings/internal-users', method: 'POST', name: 'create_internal_user', displayName: 'Create Internal User' },
			{ endpoint: '/api/v1/settings/internal-users/:id', method: 'PUT', name: 'update_internal_user', displayName: 'Update Internal User' },
			{ endpoint: '/api/v1/settings/internal-users/:id', method: 'DELETE', name: 'delete_internal_user', displayName: 'Delete Internal User' },
		],
	},
	{
		group: 'Roles & Permissions',
		endpoints: [
			{ endpoint: '/api/v1/roles', method: 'GET', name: 'view_roles', displayName: 'View Roles' },
			{ endpoint: '/api/v1/roles', method: 'POST', name: 'create_role', displayName: 'Create Role' },
			{ endpoint: '/api/v1/roles/:id', method: 'PUT', name: 'update_role', displayName: 'Update Role' },
			{ endpoint: '/api/v1/roles/status/:id', method: 'PUT', name: 'update_role_status', displayName: 'Update Role Status' },
			{ endpoint: '/api/v1/permissions', method: 'GET', name: 'view_permissions', displayName: 'View Permissions' },
			{ endpoint: '/api/v1/permissions', method: 'POST', name: 'create_permission', displayName: 'Create Permission' },
			{ endpoint: '/api/v1/permissions/bulk', method: 'POST', name: 'bulk_create_permissions', displayName: 'Bulk Create Permissions' },
			{ endpoint: '/api/v1/permissions/:id', method: 'PUT', name: 'update_permission', displayName: 'Update Permission' },
			{ endpoint: '/api/v1/permissions/:id', method: 'DELETE', name: 'delete_permission', displayName: 'Delete Permission' },
			{ endpoint: '/api/v1/permissions/status/:id', method: 'PATCH', name: 'update_permission_status', displayName: 'Update Permission Status' },
			{ endpoint: '/api/v1/permissions/role/:id', method: 'PUT', name: 'update_role_permissions', displayName: 'Update Role Permissions' },
			{ endpoint: '/api/v1/permissions/clear-cache', method: 'GET', name: 'clear_permission_cache', displayName: 'Clear Permission Cache' },
			{ endpoint: '/api/v1/endpoints', method: 'GET', name: 'view_endpoints', displayName: 'View Available Endpoints' },
		],
	},
	{
		group: 'Projects',
		endpoints: [
			{ endpoint: '/api/v1/project', method: 'GET', name: 'view_projects', displayName: 'View Projects' },
			{ endpoint: '/api/v1/project', method: 'POST', name: 'create_project', displayName: 'Create Project' },
			{ endpoint: '/api/v1/project/:id', method: 'GET', name: 'view_project_details', displayName: 'View Project Details' },
			{ endpoint: '/api/v1/project/:id', method: 'PUT', name: 'update_project', displayName: 'Update Project' },
			{ endpoint: '/api/v1/project/:id', method: 'DELETE', name: 'delete_project', displayName: 'Delete Project' },
			{ endpoint: '/api/v1/project/summary/:id', method: 'GET', name: 'view_project_summary', displayName: 'View Project Summary' },
			{ endpoint: '/api/v1/project/users/assigned-list/:id', method: 'GET', name: 'view_project_users', displayName: 'View Project Users' },
			{ endpoint: '/api/v1/project/linked-data/:id', method: 'GET', name: 'view_project_linked_data', displayName: 'View Project Linked Data' },
		],
	},
	{
		group: 'Tasks',
		endpoints: [
			{ endpoint: '/api/v1/task', method: 'GET', name: 'view_tasks', displayName: 'View Tasks' },
			{ endpoint: '/api/v1/task', method: 'POST', name: 'create_task', displayName: 'Create Task' },
			{ endpoint: '/api/v1/task/:id', method: 'GET', name: 'view_task_details', displayName: 'View Task Details' },
			{ endpoint: '/api/v1/task/:id', method: 'PUT', name: 'update_task', displayName: 'Update Task' },
			{ endpoint: '/api/v1/task/:id', method: 'DELETE', name: 'delete_task', displayName: 'Delete Task' },
			{ endpoint: '/api/v1/task/mark-complete/:id', method: 'PUT', name: 'mark_task_complete', displayName: 'Mark Task Complete' },
		],
	},
	{
		group: 'Phases',
		endpoints: [
			{ endpoint: '/api/v1/phase', method: 'GET', name: 'view_phases', displayName: 'View Phases' },
			{ endpoint: '/api/v1/phase', method: 'POST', name: 'create_phase', displayName: 'Create Phase' },
			{ endpoint: '/api/v1/phase/:id', method: 'PUT', name: 'update_phase', displayName: 'Update Phase' },
			{ endpoint: '/api/v1/phase/:id', method: 'DELETE', name: 'delete_phase', displayName: 'Delete Phase' },
		],
	},
	{
		group: 'Clients',
		endpoints: [
			{ endpoint: '/api/v1/client', method: 'GET', name: 'view_clients', displayName: 'View Clients' },
			{ endpoint: '/api/v1/client', method: 'POST', name: 'create_client', displayName: 'Create Client' },
			{ endpoint: '/api/v1/client/:id', method: 'GET', name: 'view_client_details', displayName: 'View Client Details' },
			{ endpoint: '/api/v1/client/:id', method: 'PUT', name: 'update_client', displayName: 'Update Client' },
			{ endpoint: '/api/v1/client/:id', method: 'DELETE', name: 'delete_client', displayName: 'Delete Client' },
		],
	},
	{
		group: 'Vendors',
		endpoints: [
			{ endpoint: '/api/v1/vendor', method: 'GET', name: 'view_vendors', displayName: 'View Vendors' },
			{ endpoint: '/api/v1/vendor', method: 'POST', name: 'create_vendor', displayName: 'Create Vendor' },
			{ endpoint: '/api/v1/vendor/:id', method: 'GET', name: 'view_vendor_details', displayName: 'View Vendor Details' },
			{ endpoint: '/api/v1/vendor/:id', method: 'PUT', name: 'update_vendor', displayName: 'Update Vendor' },
			{ endpoint: '/api/v1/vendor/:id', method: 'DELETE', name: 'delete_vendor', displayName: 'Delete Vendor' },
		],
	},
	{
		group: 'Timesheet',
		endpoints: [
			{ endpoint: '/api/v1/timesheet', method: 'GET', name: 'view_timesheet', displayName: 'View Timesheet' },
			{ endpoint: '/api/v1/timesheet', method: 'POST', name: 'create_timesheet', displayName: 'Create Timesheet Entry' },
			{ endpoint: '/api/v1/timesheet/:id', method: 'GET', name: 'view_timesheet_entry', displayName: 'View Timesheet Entry' },
			{ endpoint: '/api/v1/timesheet/:id', method: 'PUT', name: 'update_timesheet', displayName: 'Update Timesheet Entry' },
			{ endpoint: '/api/v1/timesheet/:id', method: 'DELETE', name: 'delete_timesheet', displayName: 'Delete Timesheet Entry' },
			{ endpoint: '/api/v1/timesheet/week/submit', method: 'POST', name: 'submit_timesheet_week', displayName: 'Submit Timesheet Week' },
			{ endpoint: '/api/v1/timesheet/approvals', method: 'GET', name: 'view_timesheet_approvals', displayName: 'View Timesheet Approvals' },
			{ endpoint: '/api/v1/timesheet/week/:id/decision', method: 'PUT', name: 'decide_timesheet_week', displayName: 'Decide Timesheet Week' },
			{ endpoint: '/api/v1/timesheet/:id/decision', method: 'PUT', name: 'decide_timesheet_entry', displayName: 'Decide Timesheet Entry' },
			{ endpoint: '/api/v1/timesheet/approvers', method: 'GET', name: 'view_timesheet_approvers', displayName: 'View Timesheet Approvers' },
			{ endpoint: '/api/v1/timesheet/approvers', method: 'POST', name: 'create_timesheet_approver', displayName: 'Create Timesheet Approver' },
			{ endpoint: '/api/v1/timesheet/approvers/:id', method: 'PUT', name: 'update_timesheet_approver', displayName: 'Update Timesheet Approver' },
			{ endpoint: '/api/v1/timesheet/approvers/:id', method: 'DELETE', name: 'delete_timesheet_approver', displayName: 'Delete Timesheet Approver' },
		],
	},
	{
		group: 'Master Data - Phases',
		endpoints: [
			{ endpoint: '/api/v1/masterPhase', method: 'GET', name: 'view_master_phases', displayName: 'View Master Phases' },
			{ endpoint: '/api/v1/masterPhase', method: 'POST', name: 'create_master_phase', displayName: 'Create Master Phase' },
			{ endpoint: '/api/v1/masterPhase/:id', method: 'PUT', name: 'update_master_phase', displayName: 'Update Master Phase' },
			{ endpoint: '/api/v1/masterPhase/:id', method: 'DELETE', name: 'delete_master_phase', displayName: 'Delete Master Phase' },
			{ endpoint: '/api/v1/masterPhase/bulk', method: 'DELETE', name: 'bulk_delete_master_phases', displayName: 'Bulk Delete Master Phases' },
			{ endpoint: '/api/v1/masterPhase/project-type/:id', method: 'GET', name: 'view_master_phases_by_type', displayName: 'View Master Phases by Project Type' },
		],
	},
	{
		group: 'Master Data - Tasks',
		endpoints: [
			{ endpoint: '/api/v1/masterTask', method: 'GET', name: 'view_master_tasks', displayName: 'View Master Tasks' },
			{ endpoint: '/api/v1/masterTask', method: 'POST', name: 'create_master_task', displayName: 'Create Master Task' },
			{ endpoint: '/api/v1/masterTask/:id', method: 'PUT', name: 'update_master_task', displayName: 'Update Master Task' },
			{ endpoint: '/api/v1/masterTask/:id', method: 'DELETE', name: 'delete_master_task', displayName: 'Delete Master Task' },
			{ endpoint: '/api/v1/masterTask/bulk', method: 'DELETE', name: 'bulk_delete_master_tasks', displayName: 'Bulk Delete Master Tasks' },
		],
	},
	{
		group: 'Master Data - Items',
		endpoints: [
			{ endpoint: '/api/v1/masterItem', method: 'GET', name: 'view_master_items', displayName: 'View Master Items' },
			{ endpoint: '/api/v1/masterItem', method: 'POST', name: 'create_master_item', displayName: 'Create Master Item' },
			{ endpoint: '/api/v1/masterItem/:id', method: 'PUT', name: 'update_master_item', displayName: 'Update Master Item' },
			{ endpoint: '/api/v1/masterItem/:id', method: 'DELETE', name: 'delete_master_item', displayName: 'Delete Master Item' },
		],
	},
	{
		group: 'Project Types',
		endpoints: [
			{ endpoint: '/api/v1/project-type', method: 'GET', name: 'view_project_types', displayName: 'View Project Types' },
			{ endpoint: '/api/v1/project-type', method: 'POST', name: 'create_project_type', displayName: 'Create Project Type' },
			{ endpoint: '/api/v1/project-type/:id', method: 'GET', name: 'view_project_type_details', displayName: 'View Project Type Details' },
			{ endpoint: '/api/v1/project-type/:id', method: 'PUT', name: 'update_project_type', displayName: 'Update Project Type' },
			{ endpoint: '/api/v1/project-type/:id', method: 'DELETE', name: 'delete_project_type', displayName: 'Delete Project Type' },
			{ endpoint: '/api/v1/project-type-group', method: 'GET', name: 'view_project_type_groups', displayName: 'View Project Type Groups' },
			{ endpoint: '/api/v1/project-type-group', method: 'POST', name: 'create_project_type_group', displayName: 'Create Project Type Group' },
			{ endpoint: '/api/v1/project-type-group/:id', method: 'GET', name: 'view_project_type_group_details', displayName: 'View Project Type Group Details' },
			{ endpoint: '/api/v1/project-type-group/:id', method: 'PUT', name: 'update_project_type_group', displayName: 'Update Project Type Group' },
			{ endpoint: '/api/v1/project-type-group/:id', method: 'DELETE', name: 'delete_project_type_group', displayName: 'Delete Project Type Group' },
		],
	},
	{
		group: 'Timeline',
		endpoints: [
			{ endpoint: '/api/v1/timeline', method: 'GET', name: 'view_timeline', displayName: 'View Timeline' },
			{ endpoint: '/api/v1/timeline', method: 'POST', name: 'create_timeline', displayName: 'Create Timeline' },
			{ endpoint: '/api/v1/timeline/:id', method: 'GET', name: 'view_timeline_details', displayName: 'View Timeline Details' },
			{ endpoint: '/api/v1/timeline/:id', method: 'PUT', name: 'update_timeline', displayName: 'Update Timeline' },
			{ endpoint: '/api/v1/timeline/:id', method: 'DELETE', name: 'delete_timeline', displayName: 'Delete Timeline' },
			{ endpoint: '/api/v1/timeline/phase', method: 'GET', name: 'view_timeline_phases', displayName: 'View Timeline Phases' },
			{ endpoint: '/api/v1/timeline/task', method: 'GET', name: 'view_timeline_tasks', displayName: 'View Timeline Tasks' },
			{ endpoint: '/api/v1/timeline/ordered-tasks', method: 'GET', name: 'view_timeline_ordered_tasks', displayName: 'View Timeline Ordered Tasks' },
		],
	},
	{
		group: 'Quotations',
		endpoints: [
			{ endpoint: '/api/v1/quotations', method: 'GET', name: 'view_quotations', displayName: 'View Quotations' },
			{ endpoint: '/api/v1/quotations', method: 'POST', name: 'create_quotation', displayName: 'Create Quotation' },
			{ endpoint: '/api/v1/quotations/:id', method: 'GET', name: 'view_quotation_details', displayName: 'View Quotation Details' },
			{ endpoint: '/api/v1/quotations/:id', method: 'PUT', name: 'update_quotation', displayName: 'Update Quotation' },
			{ endpoint: '/api/v1/quotations/:id', method: 'DELETE', name: 'delete_quotation', displayName: 'Delete Quotation' },
		],
	},
	{
		group: 'Payments',
		endpoints: [
			{ endpoint: '/api/v1/payment', method: 'GET', name: 'view_payments', displayName: 'View Payments' },
			{ endpoint: '/api/v1/payment', method: 'POST', name: 'create_payment', displayName: 'Create Payment' },
			{ endpoint: '/api/v1/payment/:id', method: 'GET', name: 'view_payment_details', displayName: 'View Payment Details' },
			{ endpoint: '/api/v1/payment/:id', method: 'PUT', name: 'update_payment', displayName: 'Update Payment' },
			{ endpoint: '/api/v1/payment/:id', method: 'DELETE', name: 'delete_payment', displayName: 'Delete Payment' },
		],
	},
	{
		group: 'File Manager',
		endpoints: [
			{ endpoint: '/api/v1/file-manager', method: 'GET', name: 'view_files', displayName: 'View Files' },
			{ endpoint: '/api/v1/file-manager', method: 'POST', name: 'create_file', displayName: 'Create File/Folder' },
			{ endpoint: '/api/v1/file-manager/folder/:id', method: 'GET', name: 'view_folder', displayName: 'View Folder' },
			{ endpoint: '/api/v1/file-manager/file/:id', method: 'GET', name: 'view_file', displayName: 'View File' },
			{ endpoint: '/api/v1/file-manager/folders', method: 'GET', name: 'view_all_folders', displayName: 'View All Folders' },
			{ endpoint: '/api/v1/file-manager/file', method: 'GET', name: 'view_all_files', displayName: 'View All Files' },
			{ endpoint: '/api/v1/file-manager/:id', method: 'PUT', name: 'update_file', displayName: 'Update File/Folder' },
			{ endpoint: '/api/v1/file-manager/:id', method: 'DELETE', name: 'delete_file', displayName: 'Delete File/Folder' },
		],
	},
	{
		group: 'MOM (Minutes of Meeting)',
		endpoints: [
			{ endpoint: '/api/v1/mom', method: 'GET', name: 'view_moms', displayName: 'View MOMs' },
			{ endpoint: '/api/v1/mom', method: 'POST', name: 'create_mom', displayName: 'Create MOM' },
			{ endpoint: '/api/v1/mom/:id', method: 'GET', name: 'view_mom_details', displayName: 'View MOM Details' },
			{ endpoint: '/api/v1/mom/:id', method: 'PUT', name: 'update_mom', displayName: 'Update MOM' },
			{ endpoint: '/api/v1/mom/:id', method: 'DELETE', name: 'delete_mom', displayName: 'Delete MOM' },
		],
	},
	{
		group: 'Snags',
		endpoints: [
			{ endpoint: '/api/v1/snag', method: 'GET', name: 'view_snags', displayName: 'View Snags' },
			{ endpoint: '/api/v1/snag', method: 'POST', name: 'create_snag', displayName: 'Create Snag' },
			{ endpoint: '/api/v1/snag/:id', method: 'GET', name: 'view_snag_details', displayName: 'View Snag Details' },
			{ endpoint: '/api/v1/snag/:id', method: 'PUT', name: 'update_snag', displayName: 'Update Snag' },
			{ endpoint: '/api/v1/snag/:id', method: 'DELETE', name: 'delete_snag', displayName: 'Delete Snag' },
		],
	},
	{
		group: 'Site Visit',
		endpoints: [
			{ endpoint: '/api/v1/site-visit', method: 'GET', name: 'view_site_visits', displayName: 'View Site Visits' },
			{ endpoint: '/api/v1/site-visit', method: 'POST', name: 'create_site_visit', displayName: 'Create Site Visit' },
			{ endpoint: '/api/v1/site-visit/:id', method: 'GET', name: 'view_site_visit_details', displayName: 'View Site Visit Details' },
			{ endpoint: '/api/v1/site-visit/:id', method: 'PUT', name: 'update_site_visit', displayName: 'Update Site Visit' },
			{ endpoint: '/api/v1/site-visit/:id', method: 'DELETE', name: 'delete_site_visit', displayName: 'Delete Site Visit' },
		],
	},
	{
		group: 'Deliverables',
		endpoints: [
			{ endpoint: '/api/v1/deliverable', method: 'GET', name: 'view_deliverables', displayName: 'View Deliverables' },
			{ endpoint: '/api/v1/deliverable', method: 'POST', name: 'create_deliverable', displayName: 'Create Deliverable' },
			{ endpoint: '/api/v1/deliverable/:id', method: 'GET', name: 'view_deliverable_details', displayName: 'View Deliverable Details' },
			{ endpoint: '/api/v1/deliverable/:id', method: 'PUT', name: 'update_deliverable', displayName: 'Update Deliverable' },
			{ endpoint: '/api/v1/deliverable/:id', method: 'DELETE', name: 'delete_deliverable', displayName: 'Delete Deliverable' },
		],
	},
	{
		group: 'Comments',
		endpoints: [
			{ endpoint: '/api/v1/comment', method: 'GET', name: 'view_comments', displayName: 'View Comments' },
			{ endpoint: '/api/v1/comment', method: 'POST', name: 'create_comment', displayName: 'Create Comment' },
			{ endpoint: '/api/v1/comment/:id', method: 'PUT', name: 'update_comment', displayName: 'Update Comment' },
			{ endpoint: '/api/v1/comment/:id', method: 'DELETE', name: 'delete_comment', displayName: 'Delete Comment' },
		],
	},
	{
		group: 'Sub Tasks',
		endpoints: [
			{ endpoint: '/api/v1/subTask', method: 'GET', name: 'view_subtasks', displayName: 'View Sub Tasks' },
			{ endpoint: '/api/v1/subTask', method: 'POST', name: 'create_subtask', displayName: 'Create Sub Task' },
			{ endpoint: '/api/v1/subTask/:id', method: 'PUT', name: 'update_subtask', displayName: 'Update Sub Task' },
			{ endpoint: '/api/v1/subTask/:id', method: 'DELETE', name: 'delete_subtask', displayName: 'Delete Sub Task' },
		],
	},
	{
		group: 'Categories',
		endpoints: [
			{ endpoint: '/api/v1/category', method: 'GET', name: 'view_categories', displayName: 'View Categories' },
			{ endpoint: '/api/v1/category', method: 'POST', name: 'create_category', displayName: 'Create Category' },
			{ endpoint: '/api/v1/category/:id', method: 'PUT', name: 'update_category', displayName: 'Update Category' },
			{ endpoint: '/api/v1/category/:id', method: 'DELETE', name: 'delete_category', displayName: 'Delete Category' },
		],
	},
	{
		group: 'Sub Categories',
		endpoints: [
			{ endpoint: '/api/v1/category/sub', method: 'GET', name: 'view_sub_categories', displayName: 'View Sub Categories' },
			{ endpoint: '/api/v1/category/sub', method: 'POST', name: 'create_sub_category', displayName: 'Create Sub Category' },
			{ endpoint: '/api/v1/category/sub/:id', method: 'PUT', name: 'update_sub_category', displayName: 'Update Sub Category' },
			{ endpoint: '/api/v1/category/sub/:id', method: 'DELETE', name: 'delete_sub_category', displayName: 'Delete Sub Category' },
		],
	},
	{
		group: 'Brands',
		endpoints: [
			{ endpoint: '/api/v1/category/brand', method: 'GET', name: 'view_brands', displayName: 'View Brands' },
			{ endpoint: '/api/v1/category/brand', method: 'POST', name: 'create_brand', displayName: 'Create Brand' },
			{ endpoint: '/api/v1/category/brand/:id', method: 'PUT', name: 'update_brand', displayName: 'Update Brand' },
			{ endpoint: '/api/v1/category/brand/:id', method: 'DELETE', name: 'delete_brand', displayName: 'Delete Brand' },
		],
	},
	{
		group: 'Activities',
		endpoints: [
			{ endpoint: '/api/v1/activities', method: 'GET', name: 'view_activities', displayName: 'View Activities' },
			{ endpoint: '/api/v1/activities/project/:id', method: 'GET', name: 'view_project_activities', displayName: 'View Project Activities' },
			{ endpoint: '/api/v1/activities/project/:id/summary', method: 'GET', name: 'view_project_activities_summary', displayName: 'View Project Activities Summary' },
		],
	},
	{
		group: 'Summary',
		endpoints: [
			{ endpoint: '/api/v1/summary', method: 'GET', name: 'view_summary', displayName: 'View Summary' },
			{ endpoint: '/api/v1/summary/:id', method: 'GET', name: 'view_summary_details', displayName: 'View Summary Details' },
			{ endpoint: '/api/v1/summary/task', method: 'GET', name: 'view_task_summary', displayName: 'View Task Summary' },
			{ endpoint: '/api/v1/summary/running-tasks', method: 'GET', name: 'view_running_tasks_summary', displayName: 'View Running Tasks Summary' },
			{ endpoint: '/api/v1/summary/payment-progress', method: 'GET', name: 'view_payment_progress', displayName: 'View Payment Progress' },
			{ endpoint: '/api/v1/summary/mom-progress', method: 'GET', name: 'view_mom_progress', displayName: 'View MOM Progress' },
			{ endpoint: '/api/v1/summary/tasks-by-type', method: 'GET', name: 'view_tasks_by_type', displayName: 'View Tasks By Type' },
		],
	},
	{
		group: 'Notifications',
		endpoints: [
			{ endpoint: '/api/v1/notifications', method: 'GET', name: 'view_notifications', displayName: 'View Notifications' },
			{ endpoint: '/api/v1/notifications/count', method: 'GET', name: 'view_notification_count', displayName: 'View Notification Count' },
			{ endpoint: '/api/v1/notifications/read-all', method: 'PUT', name: 'mark_all_notifications_read', displayName: 'Mark All Notifications Read' },
			{ endpoint: '/api/v1/notifications/:id/read', method: 'PUT', name: 'mark_notification_read', displayName: 'Mark Notification Read' },
		],
	},
	{
		group: 'Settings - Policy',
		endpoints: [
			{ endpoint: '/api/v1/settings/policy', method: 'GET', name: 'view_policies', displayName: 'View Policies' },
			{ endpoint: '/api/v1/settings/policy', method: 'POST', name: 'create_policy', displayName: 'Create Policy' },
			{ endpoint: '/api/v1/settings/policy/:id', method: 'GET', name: 'view_policy_details', displayName: 'View Policy Details' },
			{ endpoint: '/api/v1/settings/policy/:id', method: 'PUT', name: 'update_policy', displayName: 'Update Policy' },
			{ endpoint: '/api/v1/settings/policy/:id', method: 'DELETE', name: 'delete_policy', displayName: 'Delete Policy' },
		],
	},
	{
		group: 'Settings - Designation',
		endpoints: [
			{ endpoint: '/api/v1/settings/designation', method: 'GET', name: 'view_designations', displayName: 'View Designations' },
			{ endpoint: '/api/v1/settings/designation', method: 'POST', name: 'create_designation', displayName: 'Create Designation' },
			{ endpoint: '/api/v1/settings/designation/:id', method: 'PUT', name: 'update_designation', displayName: 'Update Designation' },
			{ endpoint: '/api/v1/settings/designation/:id', method: 'DELETE', name: 'delete_designation', displayName: 'Delete Designation' },
		],
	},
	{
		group: 'Settings - Department',
		endpoints: [
			{ endpoint: '/api/v1/settings/department', method: 'GET', name: 'view_departments', displayName: 'View Departments' },
			{ endpoint: '/api/v1/settings/department', method: 'POST', name: 'create_department', displayName: 'Create Department' },
			{ endpoint: '/api/v1/settings/department/:id', method: 'GET', name: 'view_department_details', displayName: 'View Department Details' },
			{ endpoint: '/api/v1/settings/department/:id', method: 'PUT', name: 'update_department', displayName: 'Update Department' },
			{ endpoint: '/api/v1/settings/department/:id', method: 'DELETE', name: 'delete_department', displayName: 'Delete Department' },
		],
	},
	{
		group: 'Settings - Organization',
		endpoints: [
			{ endpoint: '/api/v1/settings/organization', method: 'GET', name: 'view_organization', displayName: 'View Organization' },
			{ endpoint: '/api/v1/settings/organization', method: 'PUT', name: 'update_organization', displayName: 'Update Organization' },
		],
	},
	{
		group: 'Sidebar',
		endpoints: [
			{ endpoint: '/api/v1/sidebar', method: 'GET', name: 'view_sidebar', displayName: 'View Sidebar' },
			{ endpoint: '/api/v1/sidebar', method: 'POST', name: 'create_sidebar', displayName: 'Create Sidebar' },
			{ endpoint: '/api/v1/sidebar/:id', method: 'PUT', name: 'update_sidebar', displayName: 'Update Sidebar' },
		],
	},
	{
		group: 'Upload',
		endpoints: [
			{ endpoint: '/api/v1/upload', method: 'POST', name: 'upload_file', displayName: 'Upload File' },
			{ endpoint: '/api/v1/upload/multiple', method: 'POST', name: 'upload_multiple_files', displayName: 'Upload Multiple Files' },
		],
	},
	{
		group: 'Pincode',
		endpoints: [
			{ endpoint: '/api/v1/pincode', method: 'GET', name: 'view_pincode', displayName: 'View Pincode' },
		],
	},
];

/**
 * Get flat list of all endpoints
 */
export function getAllEndpoints() {
	const endpoints = [];
	for (const group of ENDPOINT_GROUPS) {
		for (const endpoint of group.endpoints) {
			endpoints.push({
				...endpoint,
				group: group.group,
			});
		}
	}
	return endpoints;
}

/**
 * Get endpoints grouped by category
 */
export function getGroupedEndpoints() {
	return ENDPOINT_GROUPS;
}

export default ENDPOINT_GROUPS;
