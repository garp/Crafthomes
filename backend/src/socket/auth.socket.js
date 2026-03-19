import jwt from 'jsonwebtoken';
import { JWT } from '../../config/server.js';
import UserServices from '../services/modelServices/user.services.js';
import { logWarn } from '../utils/logger.js';

// Extract token from socket handshake
export const socketAuthMiddleware = async (socket, next) => {
	try {
		// Token can be in query string, auth object, or headers
		const token =
			socket.handshake.query?.token ||
			socket.handshake.auth?.token ||
			socket.handshake.headers?.authorization?.replace('Bearer ', '');

		if (!token) {
			return next(new Error('Authentication required'));
		}

		const decoded = jwt.verify(token, JWT.ACCESS_SECRET);
		if (!decoded?.id) {
			return next(new Error('Invalid token'));
		}

		const user = await UserServices.findOne({
			where: { id: decoded.id, status: 'ACTIVE' },
			select: { id: true, email: true, roleId: true, userType: true },
		});

		if (!user) {
			return next(new Error('User not found'));
		}

		// Attach user to socket for later use
		socket.user = user;
		next();
	} catch (err) {
		logWarn(`Socket auth failed: ${err.message}`);
		next(new Error('Authentication failed'));
	}
};

