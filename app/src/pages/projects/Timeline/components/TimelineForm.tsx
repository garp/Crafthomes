import { useEffect, useMemo } from 'react';
import { useFormik } from 'formik';
import { ValidationError } from 'yup';
import {
  getAddTimelineSchema,
  type TCreateTimelineFormData,
  type TAddTimelineSchemaContext,
  addTimelineDays,
} from '../../../../validators/projectTimeline';

import { Button } from '../../../../components';
import FormLabel from '../../../../components/base/FormLabel';
import FormInput from '../../../../components/base/FormInput';
import FormDate from '../../../../components/base/FormDate';
import FormSelect from '../../../../components/base/FormSelect';
import type { TFormProps } from '../../../../types/common.types';

export type TTimelineFormProps = TFormProps<TCreateTimelineFormData> & {
  schemaContext?: TAddTimelineSchemaContext;
  templateOptions?: { label: string; value: string; duration?: number | null }[];
};

const editableTimelineStatusOptions = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

export const TimelineForm = ({
  disabled,
  onSubmit,
  initialValues,
  mode,
  schemaContext,
  templateOptions = [],
}: TTimelineFormProps) => {
  const formik = useFormik<TCreateTimelineFormData>({
    initialValues,
    enableReinitialize: mode === 'edit',
    validate: async (values) => {
      const selectedTemplate = templateOptions.find(
        (opt) => opt.value === values.templateTimelineId,
      );
      const schema = getAddTimelineSchema({
        ...schemaContext,
        selectedTemplateDuration: selectedTemplate?.duration ?? null,
      });

      try {
        await schema.validate(values, { abortEarly: false });
        return {};
      } catch (error) {
        if (!(error instanceof ValidationError)) return {};
        return error.inner.reduce<Record<string, string>>((acc, currentError) => {
          if (currentError.path && !acc[currentError.path]) {
            acc[currentError.path] = currentError.message;
          }
          return acc;
        }, {});
      }
    },
    onSubmit: (data, { resetForm }) => onSubmit({ data, resetForm }),
  });

  const selectedTemplateDuration = useMemo(() => {
    const selectedTemplate = templateOptions.find(
      (opt) => opt.value === formik.values.templateTimelineId,
    );
    return selectedTemplate?.duration ?? null;
  }, [formik.values.templateTimelineId, templateOptions]);

  useEffect(() => {
    if (mode !== 'create' || selectedTemplateDuration == null || !formik.values.plannedStart)
      return;
    const nextPlannedEnd = addTimelineDays(formik.values.plannedStart, selectedTemplateDuration);
    if (!nextPlannedEnd) return;
    const currentEnd = formik.values.plannedEnd
      ? new Date(formik.values.plannedEnd).getTime()
      : null;
    if (currentEnd === nextPlannedEnd.getTime()) return;
    formik.setFieldValue('plannedEnd', nextPlannedEnd);
  }, [formik, mode, formik.values.plannedStart, selectedTemplateDuration]);

  return (
    <form
      onSubmit={formik.handleSubmit}
      className='px-6 pt-6 pb-3 space-y-6 flex flex-col h-[92vh]'
    >
      <div className='space-y-6'>
        {/* Name */}
        <div className='flex items-center'>
          <FormLabel className='block text-sm font-medium mb-2 w-[40%]'>Name</FormLabel>
          <FormInput
            disabled={disabled}
            placeholder='Enter Timeline Name'
            name='name'
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className='w-[60%]'
            error={formik.touched.name ? formik.errors.name : undefined}
          />
        </div>

        {mode === 'create' && (
          <div className='flex items-center'>
            <FormLabel className='block text-sm font-medium mb-2 w-[40%]'>
              Choose Timeline
            </FormLabel>
            <FormSelect
              clearable
              searchable
              placeholder='Select timeline template'
              value={formik.values.templateTimelineId || null}
              onChange={(value) => {
                formik.setFieldValue('templateTimelineId', value || null);
                const selected = templateOptions.find((opt) => opt.value === value);
                formik.setFieldValue('name', selected ? selected.label : '');
                if (selected && formik.values.plannedStart) {
                  const templateDuration = selected.duration ?? 0;
                  formik.setFieldValue(
                    'plannedEnd',
                    addTimelineDays(formik.values.plannedStart, templateDuration),
                  );
                }
              }}
              onBlur={() => formik.setFieldTouched('templateTimelineId', true)}
              className='w-[60%]'
              options={templateOptions}
              noOptionsPlaceholder='No timeline templates available'
              error={
                formik.touched.templateTimelineId && formik.errors.templateTimelineId
                  ? String(formik.errors.templateTimelineId)
                  : undefined
              }
            />
          </div>
        )}

        {/* Planned Start */}
        <div className='flex items-center'>
          <FormLabel className='block text-sm font-medium mb-2 w-[40%]'>Planned Start</FormLabel>
          <FormDate
            disabled={disabled}
            placeholder='Select date'
            name='plannedStart'
            value={formik.values.plannedStart}
            onChange={(date) => formik.setFieldValue('plannedStart', date)}
            onBlur={() => formik.setFieldTouched('plannedStart', true)}
            className='w-[60%]'
            error={
              formik.touched.plannedStart && formik.errors.plannedStart
                ? String(formik.errors.plannedStart)
                : undefined
            }
          />
        </div>

        {/* Planned End */}
        <div className='flex items-center'>
          <FormLabel className='block text-sm font-medium mb-2 w-[40%]'>Planned End</FormLabel>
          <FormDate
            disabled={disabled}
            placeholder='Select date'
            name='plannedEnd'
            value={formik.values.plannedEnd}
            onChange={(date) => formik.setFieldValue('plannedEnd', date)}
            onBlur={() => formik.setFieldTouched('plannedEnd', true)}
            className='w-[60%]'
            error={
              formik.touched.plannedEnd && formik.errors.plannedEnd
                ? String(formik.errors.plannedEnd)
                : undefined
            }
          />
        </div>

        {mode === 'edit' && (
          <div className='flex items-center'>
            <FormLabel className='block text-sm font-medium mb-2 w-[40%]'>Status</FormLabel>
            <FormSelect
              disabled={disabled}
              placeholder='Select status'
              value={formik.values.timelineStatus || null}
              onChange={(value) => formik.setFieldValue('timelineStatus', value || null)}
              onBlur={() => formik.setFieldTouched('timelineStatus', true)}
              className='w-[60%]'
              options={editableTimelineStatusOptions}
              error={
                formik.touched.timelineStatus && formik.errors.timelineStatus
                  ? String(formik.errors.timelineStatus)
                  : undefined
              }
            />
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button radius='full' type='submit' disabled={disabled} className='text-sm! mt-auto ml-auto'>
        {disabled
          ? mode === 'create'
            ? 'Adding...'
            : 'Updating...'
          : mode === 'create'
            ? 'Add Timeline'
            : 'Update Timeline'}
      </Button>
    </form>
  );
};
