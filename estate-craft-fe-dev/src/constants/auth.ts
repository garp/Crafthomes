export const errorResponse = {
  'E-101': {
    message: 'Invalid email or password!',
    httpStatus: 400,
  },
  'E-102': {
    message: 'User name already exists!',
    httpStatus: 400,
  },
  'E-103': {
    message: 'Please login again!',
    httpStatus: 400,
  },
  'E-104': {
    message: 'User not found!',
    httpStatus: 400,
  },
  'E-105': {
    message: 'User is blocked!',
    httpStatus: 400,
  },
  'E-106': {
    message: 'Cannot update user!',
    httpStatus: 400,
  },
  'E-107': {
    message: 'Password change required!',
    httpStatus: 400,
  },
  'E-108': {
    message: 'Cannot save same password!',
    httpStatus: 400,
  },
  'E-111': {
    message: 'User with same email, phone number already exists!',
    httpStatus: 400,
  },
  'E-001': {
    message: 'Server error.',
    httpStatus: 500,
  },
  'E-002': {
    message: 'Access denied!',
    httpStatus: 401,
  },
  'E-003': {
    message: 'Invalid Token!',
    httpStatus: 401,
  },
  'E-004': {
    message: 'Token expired!',
    httpStatus: 401,
  },
  'E-005': {
    message: 'Invalid request body!',
    httpStatus: 400,
  },
  'E-006': {
    message: 'Token missing!',
    httpStatus: 400,
  },
  'E-007': {
    message: 'Access denied!',
    httpStatus: 400,
  },
  'E-400': {
    message: 'Bad request!',
    httpStatus: 400,
  },
  'E-409': {
    message: 'Conflict! Resource already exists.',
    httpStatus: 409,
  },
  'E-412': {
    message: 'Precondition failed.',
    httpStatus: 412,
  },
  'E-413': {
    message: 'Payload too large.',
    httpStatus: 413,
  },
  'E-415': {
    message: 'Unsupported media type.',
    httpStatus: 415,
  },
  'E-422': {
    message: 'Unprocessable entity.',
    httpStatus: 422,
  },
  'E-429': {
    message: 'Too many requests.',
    httpStatus: 429,
  },
  'E-503': {
    message: 'Service unavailable.',
    httpStatus: 503,
  },
};
