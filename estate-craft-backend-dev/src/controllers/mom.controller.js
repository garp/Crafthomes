import MOMServices from '../services/modelServices/mom.services.js';
import MomAttendeesServices from '../services/modelServices/mapping/momAttendees.services.js';
import AttachmentServices from '../services/modelServices/attachment.services.js';
import UserServices from '../services/modelServices/user.services.js';
import ProjectServices from '../services/modelServices/project.services.js';
import EmailService from '../services/modelServices/email.services.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';

class MOMController {
	create = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { attendeeIds = [], attachments = [], ...momData } = req.body;

		// Validate project exists
		const project = await ProjectServices.findOne({
			where: { id: momData.projectId },
		});
		if (!project) return errorHandler('E-401', res);

		// Validate attendees if provided
		let attendeeUsers = [];
		if (attendeeIds.length > 0) {
			attendeeUsers = await UserServices.findMany({
				where: { id: { in: attendeeIds } },
				select: { id: true, name: true, email: true },
			});
			if (attendeeUsers.length !== attendeeIds.length) {
				return errorHandler('E-1303', res);
			}
		}

		// Create MOM
		const mom = await MOMServices.create({
			data: {
				...momData,
				createdBy: userId,
			},
		});

		// Create attendees mapping
		if (attendeeIds.length > 0) {
			await MomAttendeesServices.createMany({
				data: attendeeIds.map(uid => ({ momId: mom.id, userId: uid })),
			});
		}

		// Create attachments
		let createdAttachments = [];
		if (attachments.length > 0) {
			await AttachmentServices.createMany({
				data: attachments.map(att => ({
					...att,
					momId: mom.id,
					projectId: momData.projectId,
					createdBy: userId,
				})),
			});
			// Fetch created attachments for email
			createdAttachments = await AttachmentServices.findMany({
				where: { momId: mom.id },
				select: { id: true, name: true, url: true, type: true, mimeType: true, size: true },
			});
		}

		// Send email to attendees in background
		if (attendeeUsers.length > 0) {
			setImmediate(async () => {
				try {
					// Get current user's name
					const currentUser = await UserServices.findOne({
						where: { id: userId },
						select: { name: true },
					});

					// Build MOM data for email
					const momDataForEmail = {
						id: mom.id,
						title: momData.title,
						startDate: momData.startDate,
						heldOn: momData.heldOn,
						purpose: momData.purpose,
						momStatus: mom.momStatus || 'PENDING',
						projectId: momData.projectId,
						project: { id: project.id, name: project.name },
						momAttendees: attendeeUsers.map(u => ({ user: u })),
						attachments: createdAttachments,
						createdByUser: currentUser,
					};

					// Get attendee emails
					const attendeeEmails = attendeeUsers
						.map(u => u.email)
						.filter(email => email);

					if (attendeeEmails.length > 0) {
						const emailResult = await EmailService.sendMOMShareEmail({
							toEmails: attendeeEmails,
							momData: momDataForEmail,
							sharedByName: currentUser?.name || 'A team member',
						});

						if (!emailResult.success && !emailResult.skipped) {
							console.error('Failed to send MOM email to attendees:', emailResult.error);
						}
					}
				} catch (err) {
					console.error('Unexpected error while sending MOM email to attendees:', err);
				}
			});
		}

		return responseHandler(mom, res);
	});

	get = asyncHandler(async (req, res) => {
		const { id, projectId, search, pageNo = 0, pageLimit = 10, sortType = 'createdAt', sortOrder = -1 } = req.query;

		const where = {};
		const orderBy = {
			[sortType]: sortOrder == 1 ? 'asc' : 'desc',
		};

		if (id) where.id = id;
		if (projectId) where.projectId = projectId;

		if (search) {
			where.OR = [
				{ title: { contains: search, mode: 'insensitive' } },
				{ purpose: { contains: search, mode: 'insensitive' } },
				{ heldOn: { contains: search, mode: 'insensitive' } },
			];
		}

		const totalCount = await MOMServices.count({ where });
		const moms = await MOMServices.findMany({
			where,
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			orderBy,
			include: {
				project: {
					select: {
						id: true,
						sNo: true,
						name: true,
					},
				},
				momAttendees: {
					select: {
						id: true,
						user: {
							select: {
								id: true,
								name: true,
								email: true,
							},
						},
					},
				},
				attachments: {
					select: {
						id: true,
						name: true,
						url: true,
						key: true,
						type: true,
						mimeType: true,
						size: true,
					},
				},
				createdByUser: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		return responseHandler({ moms, totalCount }, res);
	});

	getById = asyncHandler(async (req, res) => {
		const { id } = req.params;

		const mom = await MOMServices.findOne({
			where: { id },
			include: {
				project: {
					select: {
						id: true,
						sNo: true,
						name: true,
					},
				},
				momAttendees: {
					select: {
						id: true,
						user: {
							select: {
								id: true,
								name: true,
								email: true,
							},
						},
					},
				},
				attachments: {
					select: {
						id: true,
						name: true,
						url: true,
						key: true,
						type: true,
						mimeType: true,
						size: true,
					},
				},
				createdByUser: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				updatedByUser: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		if (!mom) return errorHandler('E-1301', res);

		return responseHandler({ mom }, res);
	});

	update = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;
		const { projectId, title, startDate, heldOn, purpose, attendeeIds, attachments } = req.body;

		// Check if MOM exists
		const existingMOM = await MOMServices.findOne({ where: { id } });
		if (!existingMOM) return errorHandler('E-1301', res);

		// Validate project if being updated
		if (projectId !== undefined) {
			const project = await ProjectServices.findOne({
				where: { id: projectId },
			});
			if (!project) return errorHandler('E-401', res);
		}

		// Build update data
		const updateData = { updatedBy: userId };
		if (projectId !== undefined) updateData.projectId = projectId;
		if (title !== undefined) updateData.title = title;
		if (startDate !== undefined) updateData.startDate = startDate;
		if (heldOn !== undefined) updateData.heldOn = heldOn;
		if (purpose !== undefined) updateData.purpose = purpose;

		// Update MOM
		const mom = await MOMServices.update({
			where: { id },
			data: updateData,
		});

		// Handle attendees update
		if (attendeeIds !== undefined) {
			// Validate attendees exist
			if (attendeeIds.length > 0) {
				const existingUsers = await UserServices.findMany({
					where: { id: { in: attendeeIds } },
				});
				if (existingUsers.length !== attendeeIds.length) {
					return errorHandler('E-1303', res);
				}
			}

			// Delete existing attendees and create new ones
			await MomAttendeesServices.deleteMany({ where: { momId: id } });
			if (attendeeIds.length > 0) {
				await MomAttendeesServices.createMany({
					data: attendeeIds.map(uid => ({ momId: id, userId: uid })),
				});
			}
		}

		// Handle attachments update
		if (attachments !== undefined) {
			// Delete existing attachments for this MOM
			await AttachmentServices.deleteMany({
				where: { momId: id },
			});

			// Create new attachments
			if (attachments.length > 0) {
				await AttachmentServices.createMany({
					data: attachments.map(att => ({
						...att,
						momId: id,
						projectId: projectId || existingMOM.projectId,
						updatedBy: userId,
					})),
				});
			}
		}

		return responseHandler(mom, res);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;

		const existingMOM = await MOMServices.findOne({ where: { id } });
		if (!existingMOM) return errorHandler('E-1301', res);

		// Delete associated attendees
		await MomAttendeesServices.deleteMany({ where: { momId: id } });

		// Delete the MOM
		const mom = await MOMServices.delete({ where: { id } });

		return responseHandler(mom, res);
	});

	share = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;
		const { emails } = req.body;

		// Validate emails
		if (!emails || !Array.isArray(emails) || emails.length === 0) {
			return errorHandler('E-002', res); // Invalid input
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const invalidEmails = emails.filter(email => !emailRegex.test(email));
		if (invalidEmails.length > 0) {
			return responseHandler(
				{ success: false, message: `Invalid email format: ${invalidEmails.join(', ')}` },
				res,
				400
			);
		}

		// Fetch MOM with all details
		const mom = await MOMServices.findOne({
			where: { id },
			include: {
				project: {
					select: {
						id: true,
						sNo: true,
						name: true,
					},
				},
				momAttendees: {
					select: {
						id: true,
						user: {
							select: {
								id: true,
								name: true,
								email: true,
							},
						},
					},
				},
				attachments: {
					select: {
						id: true,
						name: true,
						url: true,
						key: true,
						type: true,
						mimeType: true,
						size: true,
					},
				},
				createdByUser: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		if (!mom) return errorHandler('E-1301', res);

		// Get the current user's name for "shared by"
		const currentUser = await UserServices.findOne({
			where: { id: userId },
			select: { name: true },
		});

		// Send response immediately - don't make user wait for email
		responseHandler(
			{
				success: true,
				message: `MOM is being shared to ${emails.length} recipient(s)`,
				recipients: emails,
			},
			res,
			200
		);

		// Send email in background (non-blocking)
		setImmediate(async () => {
			try {
				const emailResult = await EmailService.sendMOMShareEmail({
					toEmails: emails,
					momData: mom,
					sharedByName: currentUser?.name || 'A team member',
				});

				if (!emailResult.success && !emailResult.skipped) {
					console.error('Failed to send MOM share email:', emailResult.error);
				} else if (emailResult.success) {
					console.info(`MOM ${id} shared successfully to: ${emails.join(', ')}`);
				}
			} catch (err) {
				console.error('Unexpected error while sending MOM share email:', err);
			}
		});
	});
}

export default new MOMController();
