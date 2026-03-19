import cron from 'node-cron';

import PrismaService from './databaseServices/db.js';
import TimesheetReminderRuleServices from './modelServices/timesheetReminderRule.services.js';
import TimesheetReminderLogServices from './modelServices/timesheetReminderLog.services.js';
import TimesheetApproverAssignmentServices from './modelServices/timesheetApproverAssignment.services.js';
import EmailService from './modelServices/email.services.js';
import { sendNotification } from '../socket/emitters/notification.emitter.js';
import { NOTIFICATION_TYPES } from '../socket/constants.js';

let job = null;

const startOfDay = d => {
	const date = new Date(d);
	date.setHours(0, 0, 0, 0);
	return date;
};

const diffDays = (from, to) => {
	const a = startOfDay(from).getTime();
	const b = startOfDay(to).getTime();
	return Math.floor((b - a) / (24 * 60 * 60 * 1000));
};

const isConfiguredToSendEmail = () => EmailService.isConfigured && EmailService.isConfigured();

async function ensureDefaultRulesIfEmpty() {
	const existing = await TimesheetReminderRuleServices.count({ where: { active: true } });
	if (existing > 0) return;

	// Safe defaults matching your rough thresholds; recipients start at employee and then include approvers.
	const defaults = [
		{ missedDays: 1, recipientScope: 'EMPLOYEE', channel: 'EMAIL' },
		{ missedDays: 2, recipientScope: 'EMPLOYEE', channel: 'EMAIL' },
		{ missedDays: 4, recipientScope: 'APPROVERS', channel: 'EMAIL' },
		{ missedDays: 16, recipientScope: 'ADMINS', channel: 'EMAIL' },
	];

	await TimesheetReminderRuleServices.createMany({
		data: defaults.map(d => ({
			name: `Missed timesheet: ${d.missedDays} day(s)`,
			active: true,
			missedDays: d.missedDays,
			recipientScope: d.recipientScope,
			channel: d.channel,
		})),
	});
}

async function getAdminRecipients() {
	const prisma = PrismaService.getInstance();
	const users = await prisma.user.findMany({
		where: {
			status: 'ACTIVE',
			userType: 'INTERNAL',
			role: { name: { in: ['super_admin', 'admin'] } },
		},
		select: { id: true, name: true, email: true },
	});
	return users;
}

async function getManagementRecipients() {
	const prisma = PrismaService.getInstance();
	const users = await prisma.user.findMany({
		where: {
			status: 'ACTIVE',
			userType: 'INTERNAL',
			designation: { name: { in: ['MANAGEMENT', 'FOUNDER_MANAGEMENT'] } },
		},
		select: { id: true, name: true, email: true },
	});
	return users;
}

async function getApproverRecipients(employeeId) {
	const prisma = PrismaService.getInstance();
	const assignments = await TimesheetApproverAssignmentServices.findMany({
		where: { employeeId, active: true },
		select: { approverId: true, effectiveFrom: true, effectiveTo: true },
	});

	const now = new Date();
	const approverIds = assignments
		.filter(a => {
			const from = a.effectiveFrom ? new Date(a.effectiveFrom) : null;
			const to = a.effectiveTo ? new Date(a.effectiveTo) : null;
			if (from && now.getTime() < from.getTime()) return false;
			if (to && now.getTime() > to.getTime()) return false;
			return true;
		})
		.map(a => a.approverId);

	if (approverIds.length === 0) return [];
	const users = await prisma.user.findMany({
		where: { id: { in: approverIds }, status: 'ACTIVE' },
		select: { id: true, name: true, email: true },
	});
	return users;
}

async function getRecipientUsers({ scope, employee }) {
	if (scope === 'EMPLOYEE') return [employee];
	if (scope === 'APPROVERS') return getApproverRecipients(employee.id);
	if (scope === 'MANAGEMENT') return getManagementRecipients();
	if (scope === 'ADMINS') return getAdminRecipients();
	return [];
}

async function hasSentToday({ userId, ruleId, channel, date }) {
	const existing = await TimesheetReminderLogServices.findFirst({
		where: { userId, ruleId, channel, date },
		select: { id: true },
	});
	return Boolean(existing);
}

async function recordSent({ userId, ruleId, channel, date, metadata }) {
	return TimesheetReminderLogServices.create({
		data: {
			userId,
			ruleId,
			channel,
			date,
			metadata: metadata || undefined,
		},
	});
}

async function getLastTimesheetDateForUser(userId) {
	const prisma = PrismaService.getInstance();
	const row = await prisma.timesheet.findFirst({
		where: { userId },
		orderBy: { date: 'desc' },
		select: { date: true },
	});
	return row?.date ? new Date(row.date) : null;
}

async function runOnce() {
	const prisma = PrismaService.getInstance();
	await ensureDefaultRulesIfEmpty();

	const today = startOfDay(new Date());
	const rules = await TimesheetReminderRuleServices.findMany({
		where: { active: true },
		orderBy: { missedDays: 'asc' },
	});
	if (!rules || rules.length === 0) return;

	const employees = await prisma.user.findMany({
		where: { status: 'ACTIVE', userType: 'INTERNAL' },
		select: { id: true, name: true, email: true },
	});

	await Promise.all(
		employees.map(async employee => {
			const lastDate = await getLastTimesheetDateForUser(employee.id);
			if (!lastDate) return;

			const missed = diffDays(lastDate, today);
			if (missed <= 0) return;

			const matchingRules = rules.filter(r => r.missedDays === missed);
			if (matchingRules.length === 0) return;

			await Promise.all(
				matchingRules.map(async rule => {
					const { channel } = rule;
					const date = today;
					const already = await hasSentToday({ userId: employee.id, ruleId: rule.id, channel, date });
					if (already) return;

					const recipients = await getRecipientUsers({ scope: rule.recipientScope, employee });
					if (!recipients || recipients.length === 0) return;

					const payload = {
						employeeId: employee.id,
						employeeName: employee.name,
						missedDays: missed,
						lastTimesheetDate: startOfDay(lastDate).toISOString().slice(0, 10),
					};

					if (channel === 'EMAIL') {
						if (!isConfiguredToSendEmail()) return;
						await Promise.all(
							recipients
								.filter(r => r?.email)
								.map(r =>
									EmailService.sendTimesheetReminderEmail({
										toEmail: r.email,
										toName: r.name,
										employeeName: employee.name,
										missedDays: missed,
										lastTimesheetDate: payload.lastTimesheetDate,
									})
								)
						);
					}

					if (channel === 'IN_APP') {
						await Promise.all(
							recipients.map(r =>
								sendNotification({
									userId: r.id,
									actorId: null,
									type: NOTIFICATION_TYPES.TIMESHEET_REMINDER,
									title: 'Timesheet reminder',
									message: `${employee.name} has missed timesheet for ${missed} day(s).`,
									metadata: payload,
								})
							)
						);
					}

					await recordSent({ userId: employee.id, ruleId: rule.id, channel, date, metadata: payload });
				})
			);
		})
	);
}

function startTimesheetReminderScheduler() {
	// Don’t create multiple schedules (useful for tests/hot reload)
	if (job) return job;

	// Default: run every day at 09:00 server local time.
	job = cron.schedule('0 9 * * *', () => {
		runOnce().catch(err => console.error('Timesheet reminder job failed:', err));
	});

	// Run once on startup (non-blocking)
	setImmediate(() => runOnce().catch(() => {}));

	return job;
}

export default startTimesheetReminderScheduler;
