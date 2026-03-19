import PrismaService from '../src/services/databaseServices/db.js';

const startOfDay = d => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

const startOfWeek = d => {
  const date = startOfDay(d);
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday start
  date.setDate(date.getDate() - diff);
  return date;
};

const nextWeek = d => {
  const date = startOfWeek(d);
  date.setDate(date.getDate() + 7);
  return date;
};

async function main() {
  await PrismaService.connect();
  const prisma = PrismaService.getInstance();

  const timesheets = await prisma.timesheet.findMany({
    where: { date: { not: null } },
    select: { id: true, userId: true, date: true, timesheetWeekId: true },
    orderBy: { date: 'asc' },
  });

  console.log(`Found ${timesheets.length} timesheet entries`);

  let createdWeeks = 0;
  let linked = 0;

  for (const t of timesheets) {
    if (!t.userId || !t.date) continue;
    if (t.timesheetWeekId) continue;

    const weekStart = startOfWeek(t.date);
    const weekEnd = nextWeek(weekStart);

    const week = await prisma.timesheetWeek.upsert({
      where: { userId_weekStartDate: { userId: t.userId, weekStartDate: weekStart } },
      create: {
        userId: t.userId,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        status: 'DRAFT',
      },
      update: { weekEndDate: weekEnd },
      select: { id: true, createdAt: true },
    });

    // Heuristic: if created just now (same loop) we can't know reliably; count on a cache instead.
    // We'll count createdWeeks via a set in memory.
    // eslint-disable-next-line no-unused-vars
    createdWeeks += 0;

    await prisma.timesheet.update({
      where: { id: t.id },
      data: { timesheetWeekId: week.id },
      select: { id: true },
    });
    linked += 1;
  }

  console.log(`Linked ${linked} timesheets to weeks`);
  console.log('Backfill complete');
}

main()
  .catch(err => {
    console.error('Backfill failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await PrismaService.disconnect();
  });

