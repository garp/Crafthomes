import morganBody from 'morgan-body';

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';

import { CORS } from '../config/server.js';
import v1Routes from './routes/v1/index.routes.js';
import { isRedisReady } from './redisClient.js';

class App {
	constructor() {
		this.app = express();
		morganBody(this.app);
		this.initializeMiddlewares();
		this.initializeRoutes();
	}

	initializeMiddlewares() {
		this.app.use(compression());
		this.app.use(express.json({ limit: '100kb' }));
		this.app.use(
			cors({
				origin: CORS.ORIGIN,
				credentials: true,
			})
		);
		this.app.use(morgan('dev'));
	}

	initializeRoutes() {
		this.app.use('/api/v1', v1Routes);

		this.app.get('/health-check', (req, res) => {
			const redisStatus = isRedisReady();
			res.status(200).json({
				message: 'Server is running',
				redis: redisStatus ? 'connected' : 'disconnected',
				timestamp: new Date().toISOString(),
			});
		});
	}
}

export default new App().app;
