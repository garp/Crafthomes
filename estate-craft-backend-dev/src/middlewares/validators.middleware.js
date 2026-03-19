import { responseHandler, validatorErrorHandler } from '../utils/responseHandler.js';
import { logError } from '../utils/logger.js';

class Validator {
	static defaults = {
		abortEarly: false,
		allowUnknown: true,
		stripUnknown: true,
	};

	static body(schema) {
		return function validate(req, res, next) {
			const { error, value } = schema.validate(req.body, Validator.defaults);
			if (error) {
				logError(error.details[0].message);
				return validatorErrorHandler(422, res, error.details[0].message);
			}
			req.body = value;
			return next();
		};
	}

	static query(schema) {
		return function validate(req, res, next) {
			const { error, value } = schema.validate(req.query, Validator.defaults);
			if (error) {
				logError(error.details[0].message);
				return validatorErrorHandler(422, res, error.details[0].message);
			}
			req.query = value;
			return next();
		};
	}

	static params(schema) {
		return function validate(req, res, next) {
			const { error, value } = schema.validate(req.params, Validator.defaults);
			if (error) {
				logError(error.details[0].message);
				return responseHandler(error.details[0].message, res, 400);
			}
			req.params = value;
			return next();
		};
	}
}

export default Validator;
