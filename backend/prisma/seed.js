import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed script for Estate Craft Backend
 * Creates initial roles, designations, and Super Admin user
 *
 * Roles: super_admin, admin, internal_user, client, client_contact, vendor, vendor_contact
 * Designations: Founder, Creative Director, Design Manager, Project Manager,
 *               Senior Designer, Junior Designer, 3D Visualiser, Architect,
 *               Site Engineer, Accountant
 * Specialized: Electrical, Plumbing, HVAC, Flooring, Painting, Carpentry,
 *              Masonry, Roofing, Landscaping, Glass & Glazing, Steel & Fabrication,
 *              Interior Finishing, Waterproofing, Fire Safety, Security Systems
 *
 * Super Admin User:
 *   Email: admin@crafthome.com
 *   Password: admin@123
 */

const bytiveDesignations = [
	{ name: 'ADMIN', displayName: 'Admin', description: 'Administrator', meta: { role: 'Admin', accessLevel: 'full' } },
	{ name: 'MANAGEMENT', displayName: 'Management', description: 'Management Staff', meta: { role: 'Management', accessLevel: 'all_projects' } },
	{ name: 'SALES', displayName: 'Sales', description: 'Sales Team', meta: { role: 'Sales', accessLevel: 'sales_projects' } },
	{ name: 'DEVELOPMENT', displayName: 'Development', description: 'Development Team', meta: { role: 'Development', accessLevel: 'development_projects' } },
	{ name: 'DESIGNER', displayName: 'Designer', description: 'Designer Team', meta: { role: 'Designer', accessLevel: 'designer_projects' } },
	{ name: 'QA', displayName: 'QA', description: 'QA Team', meta: { role: 'QA', accessLevel: 'qa_projects' } },
	{ name: 'MARKETING', displayName: 'Marketing', description: 'Marketing Team', meta: { role: 'Marketing', accessLevel: 'marketing_projects' } },
];

const modoraDesignations = [
	{ name: 'Founder', displayName: 'Founder', description: 'Company Founder and Super Administrator', meta: { role: 'Super Admin', accessLevel: 'full' } },
	{ name: 'FOUNDER_MANAGEMENT', displayName: 'Founder/Management', description: 'Admin Access to all projects', meta: { role: 'Super Admin', accessLevel: 'all_projects' } },
	{ name: 'CREATIVE_DIRECTOR', displayName: 'Creative Director', description: 'Admin Access to projects under them', meta: { role: 'Admin', accessLevel: 'assigned_projects' } },
	{ name: 'DESIGN_MANAGER', displayName: 'Design Manager', description: 'Admin Access to projects under them', meta: { role: 'Admin', accessLevel: 'assigned_projects' } },
	{ name: 'PROJECT_MANAGER', displayName: 'Project Manager', description: 'Admin Access to projects under them', meta: { role: 'Admin', accessLevel: 'assigned_projects' } },
];

const units = [
	{ name: 'SQYD', displayName: 'Square Yard' },
	{ name: 'SQFT', displayName: 'Square Feet' },
	{ name: 'SQM', displayName: 'Square Meter' },
	{ name: 'SQCM', displayName: 'Square Centimeter' },
	{ name: 'Pieces', displayName: 'Piece' },
	{ name: 'Sets', displayName: 'Set' },
]

function getArgValue(argName) {
	const prefix = `${argName}=`;
	const found = process.argv.find(a => a.startsWith(prefix));
	return found ? found.slice(prefix.length) : null;
}

function getDesignationSet() {
	// CLI flags take priority over env vars.
	// Examples:
	//   node prisma/seed.js --bytive
	//   node prisma/seed.js --modora
	//   node prisma/seed.js --designation-set=modora
	const hasBytive = process.argv.includes('--bytive');
	const hasModora = process.argv.includes('--modora');

	if (hasBytive && hasModora) {
		throw new Error('Please use only one: --bytive or --modora');
	}

	if (process.argv.includes('--help') || process.argv.includes('-h')) {
		// eslint-disable-next-line no-console
		console.log(`
Usage:
  node prisma/seed.js [--bytive|--modora] [--designation-set=bytive|modora]

Notes:
  - Default is --bytive
  - CLI flag overrides DESIGNATION_SET env var
`);
		process.exit(0);
	}

	if (hasBytive) return 'bytive';
	if (hasModora) return 'modora';

	const explicit = (getArgValue('--designation-set') || getArgValue('--designationSet'))?.toLowerCase();
	if (explicit === 'bytive' || explicit === 'modora') return explicit;

	return (process.env.DESIGNATION_SET || 'bytive').toLowerCase();
}

// Which designation set to seed:
// - default: Bytive
// - set `DESIGNATION_SET=modora` (or use `--modora`) to seed Modora instead
const DESIGNATION_SET = getDesignationSet();
const ACTIVE_DESIGNATIONS = DESIGNATION_SET === 'modora' ? modoraDesignations : bytiveDesignations;

// If true (default), any designation not in the active seed list will be marked INACTIVE.
// Set `SEED_DESIGNATIONS_STRICT=0` to keep other existing designations untouched.
const SEED_DESIGNATIONS_STRICT = !['0', 'false', 'no'].includes(
	String(process.env.SEED_DESIGNATIONS_STRICT || '1').toLowerCase(),
);

// Only manage (activate/deactivate) designations we know about from these seed lists.
// This avoids accidentally touching any custom designations you may have added manually.
const KNOWN_DESIGNATION_NAMES = [
	...new Set([...bytiveDesignations, ...modoraDesignations].map(d => d.name)),
];

const SEED_DATA = {
	users: [
		{
			name: 'Crafthomes Admin',
			email: 'admin@crafthome.com',
			phoneNumber: '+919000000000',
			password: 'admin@123',
		},
	],
	roles: [
		{ name: 'super_admin' },
		{ name: 'admin' },
		{ name: 'internal_user' },
		{ name: 'client' },
		{ name: 'client_contact' },
		{ name: 'vendor' },
		{ name: 'vendor_contact' },
	],
	specialized: [
		{ name: 'Electrical' },
		{ name: 'Plumbing' },
		{ name: 'HVAC' },
		{ name: 'Flooring' },
		{ name: 'Painting' },
		{ name: 'Carpentry' },
		{ name: 'Masonry' },
		{ name: 'Roofing' },
		{ name: 'Landscaping' },
		{ name: 'Glass & Glazing' },
		{ name: 'Steel & Fabrication' },
		{ name: 'Interior Finishing' },
		{ name: 'Waterproofing' },
		{ name: 'Fire Safety' },
		{ name: 'Security Systems' },
	],
	designations: ACTIVE_DESIGNATIONS,
	units: units,
};

async function main() {
	console.log('🌱 Starting seed...\n');

	// 1. Create roles
	console.log('📋 Creating roles...');
	const roles = {};
	for (const roleData of SEED_DATA.roles) {
		let role = await prisma.role.findUnique({
			where: { name: roleData.name },
		});

		if (!role) {
			role = await prisma.role.create({
				data: {
					name: roleData.name,
					active: true,
				},
			});
			console.log(`   ✅ Role created: ${role.name} (ID: ${role.id})`);
		} else {
			console.log(`   ⏭️  Role already exists: ${role.name} (ID: ${role.id})`);
		}
		roles[roleData.name] = role;
	}

	// 2. Create specialized categories
	console.log('\n🔧 Creating specialized categories...');
	for (const specializedData of SEED_DATA.specialized) {
		let specialized = await prisma.specialized.findFirst({
			where: { name: specializedData.name },
		});

		if (!specialized) {
			specialized = await prisma.specialized.create({
				data: {
					name: specializedData.name,
					status: 'ACTIVE',
				},
			});
			console.log(`   ✅ Specialized created: ${specialized.name} (ID: ${specialized.id})`);
		} else {
			console.log(`   ⏭️  Specialized already exists: ${specialized.name} (ID: ${specialized.id})`);
		}
	}

	// 3. Create designations
	console.log('\n👔 Creating designations...');
	console.log(`   ℹ️  Designation set: ${DESIGNATION_SET}`);
	console.log(`   ℹ️  Strict designation cleanup: ${SEED_DESIGNATIONS_STRICT ? 'ON' : 'OFF'}`);

	// Ensure only the active set shows up as ACTIVE (and the other known set becomes INACTIVE).
	// This prevents "getting so many designations" after switching seed sets.
	const activeDesignationNames = SEED_DATA.designations.map(d => d.name);
	if (activeDesignationNames.length > 0) {
		await prisma.designation.updateMany({
			where: { name: { in: activeDesignationNames } },
			data: { status: 'ACTIVE' },
		});
	}
	if (SEED_DESIGNATIONS_STRICT) {
		// Strict mode: deactivate everything not in the active list.
		await prisma.designation.updateMany({
			where: { name: { notIn: activeDesignationNames } },
			data: { status: 'INACTIVE' },
		});
	} else {
		// Non-strict mode: only deactivate designations from the "other" known seed list.
		const inactiveKnownNames = KNOWN_DESIGNATION_NAMES.filter(n => !activeDesignationNames.includes(n));
		if (inactiveKnownNames.length > 0) {
			await prisma.designation.updateMany({
				where: { name: { in: inactiveKnownNames } },
				data: { status: 'INACTIVE' },
			});
		}
	}

	// 4. Create units
	console.log('\n🔢 Creating units...');
	for (const unitData of SEED_DATA.units) {
		let unit = await prisma.unit.findUnique({
			where: { name: unitData.name },
		});

		if (!unit) {
			unit = await prisma.unit.create({
				data: {
					name: unitData.name,
					displayName: unitData.displayName,
				},
			});
			console.log(`   ✅ Unit created: ${unit.displayName} (ID: ${unit.id})`);
		} else {
			console.log(`   ⏭️  Unit already exists: ${unit.displayName} (ID: ${unit.id})`);
		}
		units[unitData.name] = unit;
	}

	const designations = {};
	for (const desigData of SEED_DATA.designations) {
		let designation = await prisma.designation.findUnique({
			where: { name: desigData.name },
		});

		if (!designation) {
			designation = await prisma.designation.create({
				data: {
					name: desigData.name,
					displayName: desigData.displayName,
					description: desigData.description,
					meta: desigData.meta,
					status: 'ACTIVE',
				},
			});
			console.log(`   ✅ Designation created: ${designation.displayName} (ID: ${designation.id})`);
		} else {
			console.log(`   ⏭️  Designation already exists: ${designation.displayName} (ID: ${designation.id})`);
		}
		designations[desigData.name] = designation;
	}

	// 4. Create Super Admin users
	console.log('\n👤 Creating Super Admin users...');
	const founderDesignation =
		designations['ADMIN'] ??
		designations['Founder'] ??
		Object.values(designations)[0];

	if (!founderDesignation) {
		throw new Error('No designations were created; cannot create super admin user');
	}

	const passwordRounds = parseInt(process.env.PASSWORD_ROUND, 10) || 10;
	for (const userData of SEED_DATA.users) {
		let user = await prisma.user.findUnique({
			where: { email: userData.email },
		});

		if (!user) {
			const hashedPassword = await bcrypt.hash(userData.password, passwordRounds);

			user = await prisma.user.create({
				data: {
					name: userData.name,
					email: userData.email,
					phoneNumber: userData.phoneNumber,
					password: hashedPassword,
					roleId: roles['super_admin'].id,
					designationId: founderDesignation.id,
					status: 'ACTIVE',
					userType: 'INTERNAL',
					inviteState: 'COMPLETED',
					startDate: new Date(),
				},
			});
			console.log(`   ✅ User created: ${user.name} (${user.email})`);
			console.log(`      ID: ${user.id}`);
			console.log(`      Role: ${roles['super_admin'].name}`);
			console.log(`      Designation: ${founderDesignation.name}`);
		} else {
			console.log(`   ⏭️  User already exists: ${user.name} (${user.email})`);
		}
	}

	// 5. Seed module access for super_admin and admin roles
	console.log('\n🔐 Creating default module access...');

	const ALL_MODULES = [
		// Top-level modules
		{ topLevel: 'summary', typeLevel: null, subtypeLevel: null },
		{ topLevel: 'projects', typeLevel: null, subtypeLevel: null },
		{ topLevel: 'allTasks', typeLevel: null, subtypeLevel: null },
		{ topLevel: 'calendar', typeLevel: null, subtypeLevel: null },
		{ topLevel: 'allLibraries', typeLevel: null, subtypeLevel: null },
		{ topLevel: 'messages', typeLevel: null, subtypeLevel: null },
		{ topLevel: 'clients', typeLevel: null, subtypeLevel: null },
		{ topLevel: 'vendors', typeLevel: null, subtypeLevel: null },
		{ topLevel: 'timesheet', typeLevel: null, subtypeLevel: null },
		{ topLevel: 'settings', typeLevel: null, subtypeLevel: null },
		// Project sub-pages
		{ topLevel: 'projects', typeLevel: 'projectSummary', subtypeLevel: null },
		{ topLevel: 'projects', typeLevel: 'quotation', subtypeLevel: null },
		{ topLevel: 'projects', typeLevel: 'files', subtypeLevel: null },
		{ topLevel: 'projects', typeLevel: 'projectTask', subtypeLevel: null },
		{ topLevel: 'projects', typeLevel: 'timeline', subtypeLevel: null },
		{ topLevel: 'projects', typeLevel: 'snag', subtypeLevel: null },
		{ topLevel: 'projects', typeLevel: 'mom', subtypeLevel: null },
		{ topLevel: 'projects', typeLevel: 'payment', subtypeLevel: null },
		{ topLevel: 'projects', typeLevel: 'siteVisit', subtypeLevel: null },
		// Settings tabs
		{ topLevel: 'settings', typeLevel: 'users', subtypeLevel: null },
		{ topLevel: 'settings', typeLevel: 'roles', subtypeLevel: null },
		{ topLevel: 'settings', typeLevel: 'phase', subtypeLevel: null },
		{ topLevel: 'settings', typeLevel: 'projectSettings', subtypeLevel: null },
		{ topLevel: 'settings', typeLevel: 'products', subtypeLevel: null },
		{ topLevel: 'settings', typeLevel: 'organization', subtypeLevel: null },
		{ topLevel: 'settings', typeLevel: 'integrations', subtypeLevel: null },
	];

	const rolesToSeed = ['super_admin', 'admin'];
	for (const roleName of rolesToSeed) {
		const role = roles[roleName];
		if (!role) continue;

		// Check if already seeded
		const existingCount = await prisma.moduleAccess.count({ where: { roleId: role.id } });
		if (existingCount > 0) {
			console.log(`   ⏭️  Module access already exists for ${roleName} (${existingCount} entries)`);
			continue;
		}

		await prisma.moduleAccess.createMany({
			data: ALL_MODULES.map((mod) => ({
				roleId: role.id,
				topLevel: mod.topLevel,
				typeLevel: mod.typeLevel,
				subtypeLevel: mod.subtypeLevel,
				status: 'ACTIVE',
			})),
			skipDuplicates: true,
		});
		console.log(`   ✅ Module access seeded for ${roleName} (${ALL_MODULES.length} entries)`);
	}

	console.log('\n✨ Seed completed successfully!\n');
	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
	console.log('  Login Credentials:');
	for (const u of SEED_DATA.users) {
		console.log(`  📧 ${u.email}  |  🔑 ${u.password}  (${u.name})`);
	}
	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
	.catch(e => {
		console.error('❌ Seed failed:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
