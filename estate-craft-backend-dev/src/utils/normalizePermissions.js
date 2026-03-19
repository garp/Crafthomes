// Utility script to normalize existing permission endpoints in the database
import PrismaService from '../services/databaseServices/db.js';
import PermissionCacheService from '../services/permissionCache.service.js';
import { logInfo, logWarn, logError } from './logger.js';

async function normalizeExistingPermissions() {
	try {
		await PrismaService.connect();
		logInfo('Connected to database');

		// Fetch all permissions
		const permissions = await PrismaService.prisma.permissions.findMany();
		logInfo(`Found ${permissions.length} permissions to normalize`);

		let updatedCount = 0;
		let skippedCount = 0;

		for (const permission of permissions) {
			const normalizedEndpoint = PermissionCacheService.normalizeEndpoint(permission.endpoint);

			if (normalizedEndpoint !== permission.endpoint) {
				logInfo(`Normalizing: ${permission.endpoint} -> ${normalizedEndpoint}`);

				try {
					await PrismaService.prisma.permissions.update({
						where: { id: permission.id },
						data: { endpoint: normalizedEndpoint },
					});

					// Invalidate old cache
					await PermissionCacheService.invalidatePermission(permission.roleId, permission.endpoint, permission.method);

					updatedCount += 1;
				} catch (error) {
					logWarn(`Failed to update permission ${permission.id}: ${error.message}`);
				}
			} else {
				skippedCount += 1;
			}
		}

		logInfo(`✅ Normalization complete!`);
		logInfo(`   Updated: ${updatedCount}`);
		logInfo(`   Skipped (already normalized): ${skippedCount}`);

		// Clear all permission cache to ensure consistency
		await PermissionCacheService.clearAllPermissions();
		logInfo('Cache cleared');

		await PrismaService.disconnect();
		process.exit(0);
	} catch (error) {
		logError(`Error normalizing permissions: ${error.message}`);
		await PrismaService.disconnect();
		process.exit(1);
	}
}

// Run the script
normalizeExistingPermissions();
