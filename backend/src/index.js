import dotenv from 'dotenv';
import { createServer } from 'http';
import app from './app.js';
import { SERVER } from '../config/server.js';
import PrismaService from './services/databaseServices/db.js';
import { closeRedis } from './redisClient.js';
import { initializeSocket, closeSocket } from './socket/index.js';
import startTimesheetReminderScheduler from './services/timesheetReminder.service.js';

dotenv.config({
	path: `./.env.${process.env.NODE_ENV}`,
});

let server;

async function startServer() {
	try {
		await PrismaService.connect();

		// Create HTTP server from Express app
		server = createServer(app);

		// Initialize Socket.IO
		initializeSocket(server);

		// Start timesheet reminder scheduler (non-blocking)
		startTimesheetReminderScheduler();

		server.listen(SERVER.PORT, () => {
			console.log(`Estate-Craft is running at port: ${SERVER.PORT}`);
		});
	} catch (error) {
		console.error('Error starting server: ', error);
		await PrismaService.disconnect();
		await closeRedis();
		process.exit(1);
	}
}

// Graceful shutdown
async function gracefulShutdown(signal) {
	console.log(`${signal} signal received: closing HTTP server`);
	if (server) {
		// Close socket first
		await closeSocket();

		server.close(async () => {
			console.log('HTTP server closed');
			await PrismaService.disconnect();
			await closeRedis();
			process.exit(0);
		});

		// Force shutdown after 10 seconds
		setTimeout(() => {
			console.error('Could not close connections in time, forcefully shutting down');
			process.exit(1);
		}, 10000);
	}
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
