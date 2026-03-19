import { PrismaClient } from '@prisma/client';

class PrismaService {
	static instance;

	constructor() {
		throw new Error('Cannot instantiate PrismaService');
	}

	static getInstance() {
		if (!PrismaService.instance) {
			PrismaService.instance = new PrismaClient({
				log: [],
			});
		}
		return PrismaService.instance;
	}

	static async connect() {
		await PrismaService.getInstance().$connect();
	}

	static async disconnect() {
		await PrismaService.getInstance().$disconnect();
	}
}

export default PrismaService;
