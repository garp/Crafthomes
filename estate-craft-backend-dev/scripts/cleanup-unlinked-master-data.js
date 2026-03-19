import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

function hasArg(flag) {
	return process.argv.includes(flag);
}

const APPLY = hasArg('--apply');
const PHASES_ONLY = hasArg('--phases-only');
const TASKS_ONLY = hasArg('--tasks-only');
const PROJECT_TYPES_ONLY = hasArg('--project-types-only');
const DELETE_PHASES_WITHOUT_TASKS = hasArg('--delete-phases-without-tasks');

const onlyFlagsCount = [PHASES_ONLY, TASKS_ONLY, PROJECT_TYPES_ONLY].filter(Boolean).length;
if (onlyFlagsCount > 1) {
	console.error('❌ Use only one of --phases-only, --tasks-only, or --project-types-only');
	process.exit(1);
}

function preview(items, key = 'id', n = 10) {
	return items.slice(0, n).map(x => x[key]);
}

async function main() {
	console.log(`🔎 Cleanup unlinked master data (dry-run=${APPLY ? 'no' : 'yes'})`);
	console.log(`   Flags: ${process.argv.slice(2).join(' ') || '(none)'}\n`);

	// "Linked to any projectType" is defined as having at least one of:
	// - ProjectTypeMasterPhase mapping (MasterPhase.projectType)
	// - PhaseOrder row (MasterPhase.PhaseOrder)
	// - MasterPhaseOrder row (MasterPhase.MasterPhaseOrder)
	//
	// We also require the MasterPhase not to be used by any Project Phase (Phase.masterPhaseId),
	// so we don't break existing projects.
	const unlinkedMasterPhases = TASKS_ONLY
		? []
		: await prisma.masterPhase.findMany({
				where: {
					projectType: { none: {} },
					PhaseOrder: { none: {} },
					MasterPhaseOrder: { none: {} },
					phases: { none: {} },
				},
				select: { id: true, name: true },
		  });

	// Optionally: phases that have ZERO master tasks mapped.
	// Safety: we still require this phase not to be used by any Project phase (`Phase.masterPhaseId`),
	// otherwise deleting it could break existing project timelines.
	const phasesWithoutTasks =
		DELETE_PHASES_WITHOUT_TASKS && !TASKS_ONLY
			? await prisma.masterPhase.findMany({
					where: {
						MasterPhaseMasterTask: { none: {} },
						phases: { none: {} },
					},
					select: { id: true, name: true },
			  })
			: [];

	const phaseIds = Array.from(new Set([...unlinkedMasterPhases.map(p => p.id), ...phasesWithoutTasks.map(p => p.id)]));

	// A MasterTask is "linked to a projectType" if ANY of its phase mappings points to a MasterPhase
	// that is linked to a projectType (as defined above).
	const unlinkedMasterTasks = PHASES_ONLY || PROJECT_TYPES_ONLY
		? []
		: await prisma.masterTask.findMany({
				where: {
					MasterPhaseMasterTask: {
						none: {
							MasterPhase: {
								OR: [
									{ projectType: { some: {} } },
									{ PhaseOrder: { some: {} } },
									{ MasterPhaseOrder: { some: {} } },
								],
							},
						},
					},
				},
				select: { id: true, name: true },
		  });

	const taskIds = unlinkedMasterTasks.map(t => t.id);

	// A ProjectType can be deleted if it has NO master-phase mappings AND is not used elsewhere.
	// This avoids breaking existing projects and ordering tables.
	const unlinkedProjectTypes = PHASES_ONLY || TASKS_ONLY
		? []
		: await prisma.projectType.findMany({
				where: {
					masterPhases: { none: {} }, // ProjectTypeMasterPhase mapping
					PhaseOrder: { none: {} },
					MasterPhaseOrder: { none: {} },
					Project: { none: {} },
				},
				select: { id: true, name: true },
		  });

	const projectTypeIds = unlinkedProjectTypes.map(p => p.id);

	console.log(`MasterPhase candidates to delete: ${phaseIds.length}`);
	if (DELETE_PHASES_WITHOUT_TASKS) {
		console.log(`  (includes phases without tasks: ${phasesWithoutTasks.length})`);
	}
	if (phaseIds.length > 0) {
		const sampleSource = phasesWithoutTasks.length > 0 ? phasesWithoutTasks : unlinkedMasterPhases;
		console.log(`  sample ids: ${preview(sampleSource).join(', ')}`);
	}
	console.log(`MasterTask candidates to delete: ${taskIds.length}`);
	if (taskIds.length > 0) console.log(`  sample ids: ${preview(unlinkedMasterTasks).join(', ')}`);
	console.log(`ProjectType candidates to delete: ${projectTypeIds.length}`);
	if (projectTypeIds.length > 0) console.log(`  sample ids: ${preview(unlinkedProjectTypes).join(', ')}`);

	if (!APPLY) {
		console.log('\n✅ Dry-run complete. Re-run with --apply to perform deletes.');
		return;
	}

	console.log('\n⚠️  APPLY mode: performing deletes...\n');

	await prisma.$transaction(async tx => {
		// Delete ProjectTypes first (they don't depend on master data; master data depends on them via mappings).
		if (!PHASES_ONLY && !TASKS_ONLY && projectTypeIds.length > 0) {
			const deleted = await tx.projectType.deleteMany({ where: { id: { in: projectTypeIds } } });
			console.log(`Deleted ProjectType:        ${deleted.count}\n`);
		}

		// Delete MasterPhases (and dependents) first.
		if (!TASKS_ONLY && !PROJECT_TYPES_ONLY && phaseIds.length > 0) {
			const [mappingsDeleted, phaseOrderDeleted, masterPhaseOrderDeleted, ptMappingsDeleted] = await Promise.all([
				tx.masterPhaseMasterTask.deleteMany({ where: { masterPhaseId: { in: phaseIds } } }),
				tx.phaseOrder.deleteMany({ where: { masterPhaseId: { in: phaseIds } } }),
				tx.masterPhaseOrder.deleteMany({ where: { masterPhaseId: { in: phaseIds } } }),
				tx.projectTypeMasterPhase.deleteMany({ where: { masterPhaseId: { in: phaseIds } } }),
			]);

			const phasesDeleted = await tx.masterPhase.deleteMany({ where: { id: { in: phaseIds } } });

			console.log('Deleted MasterPhase dependents:');
			console.log(`  - MasterPhaseMasterTask: ${mappingsDeleted.count}`);
			console.log(`  - PhaseOrder:            ${phaseOrderDeleted.count}`);
			console.log(`  - MasterPhaseOrder:      ${masterPhaseOrderDeleted.count}`);
			console.log(`  - ProjectTypeMasterPhase:${ptMappingsDeleted.count}`);
			console.log(`Deleted MasterPhase:       ${phasesDeleted.count}\n`);
		}

		// Recompute unlinked MasterTasks after phase cleanup (in case links were removed).
		if (!PHASES_ONLY && !PROJECT_TYPES_ONLY) {
			const recomputed = await tx.masterTask.findMany({
				where: {
					MasterPhaseMasterTask: {
						none: {
							MasterPhase: {
								OR: [
									{ projectType: { some: {} } },
									{ PhaseOrder: { some: {} } },
									{ MasterPhaseOrder: { some: {} } },
								],
							},
						},
					},
				},
				select: { id: true },
			});

			const ids = recomputed.map(t => t.id);
			if (ids.length === 0) {
				console.log('Deleted MasterTask:         0');
				return;
			}

			const taskMappingsDeleted = await tx.masterPhaseMasterTask.deleteMany({ where: { masterTaskId: { in: ids } } });
			const tasksDeleted = await tx.masterTask.deleteMany({ where: { id: { in: ids } } });

			console.log(`Deleted MasterPhaseMasterTask (by masterTaskId): ${taskMappingsDeleted.count}`);
			console.log(`Deleted MasterTask:                             ${tasksDeleted.count}`);
		}
	});

	console.log('\n✅ Cleanup complete.');
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async err => {
		console.error('❌ Cleanup failed:', err);
		await prisma.$disconnect();
		process.exit(1);
	});

