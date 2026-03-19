import { MongoClient } from 'mongodb';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Configuration
const MONGO_URI = 'mongodb://mongo:d951cebe4bf0d836143a@195.35.21.131:27017/?tls=false';
const MONGO_DB_NAME = 'infinite-green';
const MONGO_COLLECTION = 'pincodes';
const BATCH_SIZE = 1000; // Insert 1000 records at a time

async function batchImportPincodes() {
	let mongoClient;

	try {
		console.log('🚀 Starting BATCH pincode migration from MongoDB to PostgreSQL...\n');

		// Connect to MongoDB
		console.log('📡 Connecting to MongoDB...');
		console.log(`   URI: ${MONGO_URI}`);
		console.log(`   Database: ${MONGO_DB_NAME}`);
		console.log(`   Collection: ${MONGO_COLLECTION}\n`);

		mongoClient = new MongoClient(MONGO_URI);
		await mongoClient.connect();
		console.log('✅ Connected to MongoDB\n');

		const db = mongoClient.db(MONGO_DB_NAME);
		const collection = db.collection(MONGO_COLLECTION);

		// Get total count
		const totalCount = await collection.countDocuments();
		console.log(`📊 Found ${totalCount} pincode records in MongoDB\n`);

		if (totalCount === 0) {
			console.log('⚠️  No records found to migrate!');
			return;
		}

		// Fetch all documents
		console.log('📥 Fetching data from MongoDB...');
		const pincodes = await collection.find({}).toArray();
		console.log(`✅ Fetched ${pincodes.length} records\n`);

		// Transform data
		console.log('🔄 Transforming data...');
		const transformedData = pincodes.map(doc => ({
			pincode: doc.pincode,
			state: doc.state || '',
			city: doc.office || doc.devision || 'Unknown',
			district: doc.district || '',
			circle: doc.circle || null,
			region: doc.region || null,
			division: doc.devision || null,
			office: doc.office || null,
			officeType: doc.officeType || null,
			delivery: doc.delivery || null,
		}));
		console.log(`✅ Transformed ${transformedData.length} records\n`);

		// Clear existing data (optional - comment out if you want to keep existing data)
		// console.log('🗑️  Clearing existing pincodes...');
		// const deleted = await prisma.pincode.deleteMany({});
		// console.log(`   Deleted ${deleted.count} existing records\n`);

		// Insert in batches
		console.log(`💾 Inserting data in batches of ${BATCH_SIZE}...\n`);
		let totalInserted = 0;
		const startTime = Date.now();

		for (let i = 0; i < transformedData.length; i += BATCH_SIZE) {
			const batch = transformedData.slice(i, i + BATCH_SIZE);
			const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
			const totalBatches = Math.ceil(transformedData.length / BATCH_SIZE);

			try {
				const result = await prisma.pincode.createMany({
					data: batch,
					// No skipDuplicates: insert all 155599 rows (pincode number no longer unique)
				});

				totalInserted += result.count;

				const progress = Math.min(i + BATCH_SIZE, transformedData.length);
				const percentage = ((progress / transformedData.length) * 100).toFixed(1);

				console.log(
					`   ✓ Batch ${batchNumber}/${totalBatches}: Inserted ${result.count} records | Progress: ${progress}/${transformedData.length} (${percentage}%)`
				);
			} catch (error) {
				console.error(`   ✗ Error in batch ${batchNumber}:`, error.message);
			}
		}

		const endTime = Date.now();
		const duration = ((endTime - startTime) / 1000).toFixed(2);

		console.log('\n✅ Batch import completed!');
		console.log(`   📊 Total MongoDB records: ${totalCount}`);
		console.log(`   ✅ Successfully inserted: ${totalInserted}`);
		console.log(`   ⏭️  Skipped: ${transformedData.length - totalInserted}`);
		console.log(`   ⏱️  Duration: ${duration} seconds`);
		console.log(`   🚀 Speed: ${Math.round(totalInserted / duration)} records/second`);

		// Verify
		console.log('\n🔍 Verifying data in PostgreSQL...');
		const pgCount = await prisma.pincode.count();
		console.log(`   Total pincodes in PostgreSQL: ${pgCount}`);

		// Show sample
		const sample = await prisma.pincode.findMany({
			take: 3,
			orderBy: { pincode: 'asc' },
		});

		console.log('\n📋 Sample records:');
		sample.forEach(record => {
			console.log(`   ${record.pincode} - ${record.city}, ${record.district}, ${record.state}`);
		});
	} catch (error) {
		console.error('\n❌ Migration failed:', error);
		throw error;
	} finally {
		// Close connections
		if (mongoClient) {
			await mongoClient.close();
			console.log('\n🔌 Disconnected from MongoDB');
		}
		await prisma.$disconnect();
		console.log('🔌 Disconnected from PostgreSQL');
	}
}

// Run migration
batchImportPincodes()
	.then(() => {
		console.log('\n✨ Migration script completed successfully!\n');
		process.exit(0);
	})
	.catch(error => {
		console.error('\n💥 Migration script failed:', error);
		process.exit(1);
	});
