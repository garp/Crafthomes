import errorCodes from '../constants/errorCodes.js';

export const responseHandler = (data, res, httpStatus = 200) => {
	res.status(httpStatus).json({ data });
};

export const errorHandler = (errorCode, res, message = null) => {
	const error = errorCodes[errorCode];
	if (error) {
		res.status(error.httpStatus).json({
			code: error.httpStatus,
			message: message || error.message,
		});
	} else {
		res.status(500).json({
			code: 500,
			message: 'An unknown error occurred.',
		});
	}
};

export const validatorErrorHandler = (httpStatus, res, message) => {
	return res.status(httpStatus).json({
		code: httpStatus,
		message: message ? message.replace(/["']/g, '') : 'An unknown error occurred.',
	});
};
