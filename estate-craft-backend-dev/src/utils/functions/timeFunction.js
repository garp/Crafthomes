export function computeDelayedBy(plannedEnd, taskStatus) {
	if (!plannedEnd) return null; // no planned end date
	if (typeof plannedEnd === 'string') plannedEnd = new Date(plannedEnd);
	const COMPLETED = 'COMPLETED';
	if (taskStatus === COMPLETED) return 0; // completed tasks -> not delayed
	const now = new Date();
	const diffMs = now - plannedEnd; // positive if now is after plannedEnd
	if (diffMs <= 0) return 0; // not delayed yet
	const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
	return days;
}

export function computeDelayedByPhase(plannedEnd, taskStatus) {
	if (!plannedEnd) return null; // no planned end date
	if (typeof plannedEnd === 'string') plannedEnd = new Date(plannedEnd);
	const COMPLETED = 'COMPLETED';
	if (taskStatus === COMPLETED) return 0; // completed tasks -> not delayed
	const now = new Date();
	const diffMs = now - plannedEnd; // positive if now is after plannedEnd
	if (diffMs <= 0) return 0; // not delayed yet
	const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
	return days;
}

export function startDateToDuration(startDate, endDate) {
	if (!startDate || !endDate) return null;
	if (typeof startDate === 'string') startDate = new Date(startDate);
	if (typeof endDate === 'string') endDate = new Date(endDate);
	const diffMs = endDate - startDate;
	const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
	return days;
}

export const formatQuoteId = (createdAt, sNo) => {
	const d = new Date(createdAt);
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');
	const xxxx = String(sNo).padStart(4, '0');

	return `QTN-${yyyy}${mm}${dd}-${xxxx}`;
};