import * as yup from 'yup';

export type TAddTimelineSchemaContext = {
  projectStartDate?: Date | null;
  projectEndDate?: Date | null;
  selectedTemplateDuration?: number | null;
};

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const normalizeTimelineDate = (value: Date | string | null | undefined) => {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

export const addTimelineDays = (date: Date | string, days: number) => {
  const normalizedDate = normalizeTimelineDate(date);
  if (!normalizedDate) return null;
  normalizedDate.setDate(normalizedDate.getDate() + days);
  return normalizedDate;
};

export const getTimelineCalendarDayDiff = (
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
) => {
  const normalizedStart = normalizeTimelineDate(start);
  const normalizedEnd = normalizeTimelineDate(end);
  if (!normalizedStart || !normalizedEnd) return null;
  return Math.round((normalizedEnd.getTime() - normalizedStart.getTime()) / DAY_IN_MS);
};

const editableTimelineStatuses = [
  'PENDING',
  'PENDING_APPROVAL',
  'IN_PROGRESS',
  'COMPLETED',
] as const;

export const getAddTimelineSchema = (context?: TAddTimelineSchemaContext) =>
  yup.object().shape({
    name: yup
      .string()
      .trim()
      .required('Timeline name is required')
      .max(100, 'Name must be at most 100 characters'),

    plannedStart: yup
      .date()
      .typeError('Please select a valid date')
      .required('Planned start date is required')
      .test(
        'not-before-project-start',
        'Planned start cannot be before project start date',
        function (value) {
          if (!value || !context?.projectStartDate) return true;
          return new Date(value) >= new Date(context.projectStartDate);
        },
      )
      .test(
        'not-after-planned-end',
        'Planned start cannot be after planned end date',
        function (value) {
          const { plannedEnd } = this.parent;
          if (!value || !plannedEnd) return true;
          return new Date(value) <= new Date(plannedEnd);
        },
      ),

    plannedEnd: yup
      .date()
      .nullable()
      .transform((v) => (v === '' || v == null ? null : v))
      .typeError('Please select a valid date')
      .test(
        'not-after-project-end',
        'Planned end cannot be after project end date',
        function (value) {
          if (context?.selectedTemplateDuration != null) return true;
          if (!value || !context?.projectEndDate) return true;
          return new Date(value) <= new Date(context.projectEndDate);
        },
      )
      .test(
        'not-before-planned-start',
        'Planned end cannot be before planned start date',
        function (value) {
          const { plannedStart } = this.parent;
          if (!value || !plannedStart) return true;
          return new Date(value) >= new Date(plannedStart);
        },
      )
      .test('matches-template-duration', function (value) {
        if (context?.selectedTemplateDuration == null) return true;
        const { plannedStart } = this.parent;
        if (!value || !plannedStart) return true;
        const diffDays = getTimelineCalendarDayDiff(plannedStart, value);
        if (diffDays === context.selectedTemplateDuration) return true;
        return this.createError({
          message: `Planned end must be ${context.selectedTemplateDuration} day${context.selectedTemplateDuration === 1 ? '' : 's'} after planned start based on the selected template`,
        });
      }),

    templateTimelineId: yup.string().nullable().optional(),
    timelineStatus: yup.string().oneOf(editableTimelineStatuses).nullable().optional(),
  });

export const addTimelineSchema = getAddTimelineSchema();

export type TCreateTimelineFormData = yup.InferType<ReturnType<typeof getAddTimelineSchema>>;
