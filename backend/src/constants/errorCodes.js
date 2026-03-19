const User = {
	'E-101': {
		message: 'Invalid email or Password!',
		httpStatus: 400,
	},
	'E-102a': {
		message: 'User with email already exists!',
		httpStatus: 400,
	},
	'E-102b': {
		message: 'User with phone number already exists!',
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
	'E-109': {
		message: 'User with same email or phone number already exists!',
		httpStatus: 400,
	},
	'E-110': {
		message: 'Invalid OTP!',
		httpStatus: 400,
	},
	'E-111': {
		message: 'OTP expired!',
		httpStatus: 400,
	},
	'E-112': {
		message: 'Failed to send OTP email!',
		httpStatus: 500,
	},
	'E-113': {
		message: 'No OTP found for this user!',
		httpStatus: 400,
	},
	'E-114': {
		message: 'Maximum resend attempts reached! wait for 10 mins',
		httpStatus: 400,
	},
	'E-115': {
		message: 'User invite not found!',
		httpStatus: 400,
	},
	'E-116': {
		message: 'User email and userId do not match!',
		httpStatus: 400,
	},
	'E-117': {
		message: 'User invitation is already accepted!',
		httpStatus: 400,
	},
	'E-118': {
		message: 'User invitation is already rejected!',
		httpStatus: 400,
	},
	'E-119': {
		message: 'User invitation is already completed!',
		httpStatus: 400,
	},
	'E-120': {
		message: 'Invalid Invitation link!',
		httpStatus: 400,
	},
	'E-121': {
		message: 'Please complete your onboarding process!',
		httpStatus: 400,
	},
	'E-122': {
		message: 'Your account is currently inactive. Please contact Support or your administrator for assistance.',
		httpStatus: 400,
	},
};

const Permission = {
	'E-200': {
		message: 'Role not found!',
		httpStatus: 404,
	},
	'E-201': {
		message: 'Permission already exists!',
		httpStatus: 400,
	},
};

const Client = {
	'E-301': {
		message: 'Client not found!',
		httpStatus: 404,
	},
	'E-302a': {
		message: 'Client with email already exists!',
		httpStatus: 400,
	},
	'E-302b': {
		message: 'Client with phone number already exists!',
		httpStatus: 400,
	},
	'E-303': {
		message: 'Cannot create CLIENT user directly. Use /api/v1/client endpoint to create clients.',
		httpStatus: 400,
	},
	'E-304': {
		message: 'GST number is required for organization clients!',
		httpStatus: 400,
	},
};

const Project = {
	'E-401': {
		message: 'Project not found!',
		httpStatus: 404,
	},
	'E-402': {
		message: 'Project with same name already exists!',
		httpStatus: 400,
	},
	'E-403': {
		message: 'Cannot update project!',
		httpStatus: 400,
	},
	'E-404': {
		message: 'Project type phase not found!',
		httpStatus: 404,
	},
	'E-405': {
		message: 'Project type not found!',
		httpStatus: 404,
	},
	'E-406': {
		message: 'Cannot update project!',
		httpStatus: 404,
	},
	'E-407': {
		message: 'Phases are required!',
		httpStatus: 404,
	},
	'E-408': {
		message: 'One or more phases not found or inactive!',
		httpStatus: 404,
	},
	'E-409a': {
		message: 'Project type with same name already exists!',
		httpStatus: 400,
	},
};

const Master = {
	'E-501': {
		message: 'Master task not found!',
		httpStatus: 404,
	},
	'E-502': {
		message: 'Master phase not found!',
		httpStatus: 404,
	},
	'E-501a': {
		message: 'Master phase with same name already exists!',
		httpStatus: 400,
	},
};

const Timeline = {
	'E-601': {
		message: 'Timeline not found!',
		httpStatus: 404,
	},
	'E-602': {
		message: 'Phase not found!',
		httpStatus: 404,
	},
	'E-603': {
		message: 'Task not found!',
		httpStatus: 404,
	},
	'E-604': {
		message: 'SubTask not found!',
		httpStatus: 404,
	},
	'E-605': {
		message: 'Task does not belong to this phase!',
		httpStatus: 400,
	},
	'E-606': {
		message: 'Phase does not belong to this timeline!',
		httpStatus: 400,
	},
	'E-607': {
		message: 'Cannot complete task because one or more predecessor tasks are blocked!',
		httpStatus: 400,
	},
	'E-608': {
		message: 'Cannot complete task because one or more predecessor tasks are not completed!',
		httpStatus: 400,
	},
	'E-609': {
		message: 'This timeline has been deleted and is no longer accessible.',
		httpStatus: 403,
	},
};

const Vendor = {
	'E-701': {
		message: 'Vendor not found!',
		httpStatus: 404,
	},
	'E-701a': {
		message: 'Vendor with email already exists!',
		httpStatus: 400,
	},
	'E-701b': {
		message: 'Vendor with phone number already exists!',
		httpStatus: 400,
	},
	'E-702': {
		message: 'Specialized not found!',
		httpStatus: 404,
	},
	'E-703': {
		message: 'Cannot create VENDOR user directly. Use /api/v1/vendor endpoint to create vendors.',
		httpStatus: 400,
	},
};

const Pincode = {
	'E-801': {
		message: 'Pincode already exists!',
		httpStatus: 400,
	},
	'E-802': {
		message: 'Pincode not found!',
		httpStatus: 404,
	},
	'E-803': {
		message: 'Pincode is required!',
		httpStatus: 400,
	},
	'E-804': {
		message: 'Address not found!',
		httpStatus: 404,
	},
};

const Category = {
	'E-1101': {
		message: 'Category not found!',
		httpStatus: 404,
	},
	'E-1102': {
		message: 'Sub category not found!',
		httpStatus: 404,
	},
	'E-1103': {
		message: 'One or more master items not found or inactive!',
		httpStatus: 404,
	},
	'E-1104': {
		message: 'Brand not found!',
		httpStatus: 404,
	},
	'E-1105': {
		message: 'Sub category already exists!',
		httpStatus: 400,
	},
};

const Quotation = {
	'E-801': {
		message: 'Quotation not found!',
		httpStatus: 404,
	},
};

const Files = {
	'E-900': {
		message: 'Project ID is required!',
		httpStatus: 400,
	},
	'E-901': {
		message: 'Folder not found!',
		httpStatus: 404,
	},
	'E-902': {
		message: 'File not found!',
		httpStatus: 404,
	},
	'E-912': {
		message: 'Failed to delete file from storage!',
		httpStatus: 500,
	},
	'E-903': {
		message: 'Folder with this name already exists in this location!',
		httpStatus: 400,
	},
	'E-904': {
		message: 'A folder cannot be its own parent!',
		httpStatus: 400,
	},
	'E-905': {
		message: 'Cannot delete folder with contents. Please delete or move contents first.',
		httpStatus: 400,
	},
	'E-906': {
		message: 'Target folder not found!',
		httpStatus: 404,
	},
	'E-907': {
		message: 'Cannot move a folder to its own subfolder!',
		httpStatus: 400,
	},
	'E-908': {
		message: 'No files provided!',
		httpStatus: 400,
	},
	'E-909': {
		message: 'Resource belongs to different project!',
		httpStatus: 400,
	},
	'E-910': {
		message: 'Either fileId or folderId is required!',
		httpStatus: 400,
	},
	'E-911': {
		message: 'Cannot move both file and folder at once!',
		httpStatus: 400,
	},
};

const Comment = {
	'E-1001': {
		message: 'Comment not found!',
		httpStatus: 404,
	},
	'E-1002': {
		message: 'You are not authorized to modify this comment!',
		httpStatus: 403,
	},
	'E-1003': {
		message: 'Comment is already deleted!',
		httpStatus: 400,
	},
};

const Snag = {
	'E-1201': {
		message: 'Snag not found!',
		httpStatus: 404,
	},
	'E-1202': {
		message: 'Cannot update snag!',
		httpStatus: 400,
	},
	'E-1203': {
		message: 'Assigned user not found!',
		httpStatus: 404,
	},
	'E-1204': {
		message: 'You are not authorized to modify this snag!',
		httpStatus: 403,
	},
};

const MOM = {
	'E-1301': {
		message: 'MOM not found!',
		httpStatus: 404,
	},
	'E-1302': {
		message: 'Cannot update MOM!',
		httpStatus: 400,
	},
	'E-1303': {
		message: 'One or more attendees not found!',
		httpStatus: 404,
	},
	'E-1304': {
		message: 'You are not authorized to modify this MOM!',
		httpStatus: 403,
	},
};

const Payment = {
	'E-1401': {
		message: 'Payment not found!',
		httpStatus: 404,
	},
	'E-1402': {
		message: 'Sub total amount mismatch!',
		httpStatus: 400,
	},
};

const Policy = {
	'E-1501': {
		message: 'Policy not found!',
		httpStatus: 404,
	},
};

const Designation = {
	'E-1601': {
		message: 'Designation not found!',
		httpStatus: 404,
	},
	'E-1602': {
		message: 'Designation with this name already exists!',
		httpStatus: 409,
	},
};

const SiteVisit = {
	'E-1801': {
		message: 'Site visit not found!',
		httpStatus: 404,
	},
};

const Timesheet = {
	'E-1701': {
		message: 'Timesheet not found!',
		httpStatus: 404,
	},
	'E-1702': {
		message: 'Timesheet overlaps with an existing entry!',
		httpStatus: 409,
	},
	'E-1703': {
		message: 'Invalid timesheet time range!',
		httpStatus: 422,
	},
	'E-1704': {
		message: 'Timesheet cannot be modified in current status!',
		httpStatus: 412,
	},
};

export default {
	...User,
	...Permission,
	...Client,
	...Project,
	...Master,
	...Timeline,
	...Vendor,
	...Pincode,
	...Category,
	...Quotation,
	...Files,
	...Comment,
	...Snag,
	...MOM,
	...SiteVisit,
	...Payment,
	...Policy,
	...Designation,
	...Timesheet,
	'E-001': {
		message: 'Server error.',
		httpStatus: 500,
	},
	'E-002': {
		message: 'Access denied!',
		httpStatus: 403,
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
		httpStatus: 403,
	},
	'E-008': {
		message: 'Invalid status type',
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
