import { PrismaClient } from '@prisma/client';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Reset Data Script for Estate Craft Backend
 * 
 * This script:
 * 1. Truncates all tables in the database (preserving schema)
 * 2. Runs the seed.js to repopulate with initial data
 * 
 * Usage:
 *   node scripts/reset-data.js --view   # View mode (shows what will be deleted)
 *   node scripts/reset-data.js --delete # Actually reset the data
 */

const DELETE = process.argv.includes('--delete');
const VIEW = process.argv.includes('--view');
const BYTIVE = process.argv.includes('--bytive');
const MODORA = process.argv.includes('--modora');

if (BYTIVE && MODORA) {
	throw new Error('Please use only one: --bytive or --modora');
}

// All model names from Prisma schema (in dependency order for logging)
const MODEL_NAMES = [
	// Dependent/child tables first
	'Activity',
	'Comment',
	'Attachment',
	'MOM',
	'TaskAssignee',
	'SubTask',
	'Task',
	'Deliverable',
	'Snag',
	'Phase',
	'Timeline',
	'ProjectUser',
	'Project',
	'QuotationItem',
	'Quotation',
	'Payment',
	'MasterPhaseMasterTask',
	'ProjectTypeMasterPhase',
	'PhaseOrder',
	'MasterPhaseOrder',
	'TimelineOrder',
	'MasterTask',
	'MasterPhase',
	'MasterItem',
	'ProjectType',
	'Category',
	'Client',
	'Vendor',
	'Folder',
	'Notification',
	'OTP',
	'Pincode',
	'RolePermission',
	'Permission',
	'Policy',
	'Sidebar',
	'User',
	'AssignUser',
	'Designation',
	'Role',
	'Address',
];

// Tables to exclude from reset (reference data that should be preserved)
// NOTE: As requested, we preserve Pincode but delete everything else.
const EXCLUDED_TABLES = ['_prisma_migrations', 'Pincode'];

async function getTableNames() {
	// Get all table names from the database
	const tables = await prisma.$queryRaw`
		SELECT tablename 
		FROM pg_tables 
		WHERE schemaname = 'public' 
		ORDER BY tablename;
	`;
	return tables
		.map(t => t.tablename)
		.filter(t => !EXCLUDED_TABLES.includes(t));
}

async function getRowCounts() {
	const tables = await getTableNames();
	const counts = {};

	for (const table of tables) {
		try {
			const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}"`);
			counts[table] = Number(result[0].count);
		} catch (e) {
			counts[table] = 'error';
		}
	}

	return counts;
}

async function truncateAllTables() {
	const tables = await getTableNames();

	if (tables.length === 0) {
		console.log('   No tables found to truncate.');
		return;
	}

	// Build a single TRUNCATE statement for all tables with CASCADE
	const tableList = tables.map(t => `"${t}"`).join(', ');

	console.log(`   Truncating ${tables.length} tables...`);

	await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);

	console.log('   ✅ All tables truncated successfully');
}

function runSeed() {
	return new Promise((resolve, reject) => {
		console.log('\n🌱 Running seed script...\n');

		const seedPath = path.join(__dirname, '..', 'prisma', 'seed.js');
		const seedArgs = [];
		if (BYTIVE) seedArgs.push('--bytive');
		if (MODORA) seedArgs.push('--modora');

		const child = spawn('node', [seedPath, ...seedArgs], {
			cwd: path.join(__dirname, '..'),
			stdio: 'inherit',
			env: process.env,
		});

		child.on('close', code => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Seed process exited with code ${code}`));
			}
		});

		child.on('error', err => {
			reject(err);
		});
	});
}

async function main() {
	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
	console.log('  🔄 Estate Craft - Reset Data Script');
	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

	// Show current data counts
	console.log('📊 Current data in database:\n');
	const counts = await getRowCounts();

	const tablesWithData = Object.entries(counts)
		.filter(([_, count]) => count > 0)
		.sort((a, b) => b[1] - a[1]);
 
	if (tablesWithData.length === 0) {
		console.log('   Database is empty.\n');
	} else {
		for (const [table, count] of tablesWithData) {
			console.log(`   ${table.padEnd(30)} ${count} rows`);
		}
		console.log(`\n   Total tables with data: ${tablesWithData.length}`);
		console.log(`   Total rows: ${tablesWithData.reduce((sum, [_, count]) => sum + count, 0)}\n`);
	}

	if (!DELETE && !VIEW) {
		console.log('⚠️  No action specified. Use one of the following:\n');
		console.log('   --view   : View current data (no changes)');
		console.log('   --delete : Delete all data and re-seed\n');
		return;
	}

	if (VIEW) {
		console.log('👁️  VIEW MODE');
		console.log('   This shows what will be deleted when using --delete.');
		console.log(`   (Excluding: ${EXCLUDED_TABLES.join(', ')})\n`);
		console.log('   To proceed with reset, run with --delete flag:');
		console.log('   node scripts/reset-data.js --delete\n');
		return;
	}

	console.log('🚨 DELETE MODE - Proceeding with data reset...\n');

	// Step 1: Truncate all tables
	console.log('🗑️  Step 1: Truncating all tables...');
	await truncateAllTables();

	// Step 2: Disconnect Prisma before running seed (to avoid connection conflicts)
	await prisma.$disconnect();

	// Step 3: Run seed script
	console.log('\n📦 Step 2: Seeding database with initial data...');
	await runSeed();

	console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
	console.log('  ✅ Reset complete! Database has been reset and seeded.');
	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
	.catch(async e => {
		console.error('\n❌ Reset failed:', e.message);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
