'use client';

import { Formik, Form, FieldArray } from 'formik';
import { Table } from '@mantine/core';
import FormDate from '../../../../components/base/FormDate';
import FormSelect from '../../../../components/base/FormSelect';
import FormTextArea from '../../../../components/base/FormTextArea';
import { Button } from '../../../../components';
import {
  createSiteVisitSchema,
  type TCreateSiteVisitFormData,
} from '../../../../validators/siteVisit.validators';
import type { TFormProps } from '../../../../types/common.types';
import { TaskAssigneeCombobox } from '../../../../components/common/selectors/UserSelector';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import TaskSelectorSidebar from './TaskSelectorSidebar';
import { AddTaskSidebar } from '../../../../components/common/Task/AddTaskSidebar';
import FormAttachment from '../../../../components/base/FormAttachment';
import { priorityOptions } from '../../../../constants/common';

const STATUS_OPTIONS = [
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Reviewed', value: 'REVIEWED' },
];

const TASK_STATUS_OPTIONS = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Blocked', value: 'BLOCKED' },
];

type SiteVisitFormProps = TFormProps<TCreateSiteVisitFormData> & {
  projectId: string;
  isSubmitting?: boolean;
  phaseId?: string;
};

/** Formik touched/errors for task snapshot fields */
type TaskSnapshotFieldState = Array<{ taskTitle?: boolean; statusAtVisit?: boolean }>;
type TaskSnapshotErrorState = Array<{ taskTitle?: string; statusAtVisit?: string }>;

const SiteVisitForm = ({
  initialValues,
  onSubmit,
  projectId,
  isSubmitting,
  phaseId,
  mode = 'create',
}: SiteVisitFormProps) => {
  const [isTaskModalOpen, { open: openTaskModal, close: closeTaskModal }] = useDisclosure(false);
  const [isAddTaskOpen, { open: openAddTask, close: closeAddTask }] = useDisclosure(false);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={createSiteVisitSchema}
      onSubmit={(data, { resetForm }) => onSubmit({ data, resetForm })}
    >
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
        <Form className='space-y-5 mt-5 flex flex-col h-full mb-10'>
          <div className='flex gap-5'>
            <FormDate
              label='Visit Date & Time'
              name='startedAt'
              value={
                values.startedAt instanceof Date
                  ? values.startedAt
                  : new Date(values.startedAt as string | number)
              }
              onChange={(date: Date | string | null) => {
                const next =
                  date == null
                    ? new Date()
                    : typeof date === 'object' && 'getTime' in date
                      ? (date as Date)
                      : new Date(date as string);
                setFieldValue('startedAt', next);
              }}
              onBlur={handleBlur}
              error={touched.startedAt ? (errors.startedAt as string) : undefined}
              className='w-[20rem]'
            />

            <FormSelect
              label='Status'
              name='status'
              value={values.status}
              onChange={(value) => setFieldValue('status', value ?? '')}
              onBlur={handleBlur}
              options={STATUS_OPTIONS}
              error={touched.status ? errors.status : undefined}
              className='w-[20rem]'
              placeholder='Select Status'
            />
            <FormSelect
              label='Priority'
              name='priority'
              value={values.priority ?? ''}
              onChange={(value) => setFieldValue('priority', value || null)}
              onBlur={handleBlur}
              options={priorityOptions}
              error={touched.priority ? (errors.priority as string) : undefined}
              className='w-[20rem]'
              placeholder='Select Priority'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Assign Engineers <span className='text-red-500'>*</span>
            </label>
            <TaskAssigneeCombobox
              value={values.engineerIds || []}
              setValue={(ids) => setFieldValue('engineerIds', ids)}
              projectId={projectId}
              error={touched.engineerIds ? (errors.engineerIds as string) : undefined}
              className='w-full'
            />
          </div>

          <FormTextArea
            label='Summary / Notes'
            name='summaryText'
            value={values.summaryText || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.summaryText ? errors.summaryText : undefined}
            rows={4}
            placeholder='Add visit summary or notes...'
          />

          {/* ATTACHMENTS */}
          <FormAttachment
            label='Attachments'
            inputId='site-visit-attachments'
            folderName='site-visit'
            currentAttachments={values.attachments ?? []}
            onUpload={(files) =>
              setFieldValue(
                'attachments',
                files.map((f) => ({
                  name: f.name,
                  url: f.url,
                  key: f.key,
                  type: f.type,
                })),
              )
            }
            maxFiles={10}
            addButtonText='Add file'
          />

          {/* TASK SNAPSHOTS - compact table */}
          <div className='border border-gray-200 rounded-lg overflow-hidden'>
            <div className='flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200'>
              <div>
                <h6 className='font-medium text-gray-900'>Tasks</h6>
                <p className='text-sm text-gray-500'>Tasks to be completed during this visit</p>
              </div>
              <Button
                type='button'
                radius='md'
                variant='outline'
                size='sm'
                className='bg-white'
                onClick={openTaskModal}
              >
                <IconPlus className='size-4 mr-1' />
                Add Task
              </Button>
            </div>

            <FieldArray name='taskSnapshots'>
              {({ remove }) => (
                <>
                  {values.taskSnapshots && values.taskSnapshots.length > 0 ? (
                    <Table withColumnBorders withTableBorder={false} className='tasks-table'>
                      <Table.Thead className='bg-gray-50'>
                        <Table.Tr>
                          <Table.Th className='w-10 text-gray-600 font-medium'>#</Table.Th>
                          <Table.Th className='text-gray-600 font-medium'>Task</Table.Th>
                          <Table.Th className='w-40 text-gray-600 font-medium'>
                            Status at visit
                          </Table.Th>
                          <Table.Th className='w-12' />
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {(values.taskSnapshots ?? []).map((snapshot, index) => (
                          <Table.Tr key={index} className='align-middle'>
                            <Table.Td className='text-gray-500 text-sm'>{index + 1}</Table.Td>
                            <Table.Td className='py-2'>
                              <span className='text-sm font-medium text-gray-900'>
                                {snapshot.taskTitle}
                              </span>
                            </Table.Td>
                            <Table.Td className='p-2'>
                              <FormSelect
                                name={`taskSnapshots.${index}.statusAtVisit`}
                                value={snapshot.statusAtVisit}
                                onChange={(value) =>
                                  setFieldValue(`taskSnapshots.${index}.statusAtVisit`, value ?? '')
                                }
                                onBlur={handleBlur}
                                options={TASK_STATUS_OPTIONS}
                                error={
                                  (touched.taskSnapshots as TaskSnapshotFieldState | undefined)?.[
                                    index
                                  ]?.statusAtVisit
                                    ? (
                                        errors.taskSnapshots as TaskSnapshotErrorState | undefined
                                      )?.[index]?.statusAtVisit
                                    : undefined
                                }
                                className='mb-0!'
                                inputClassName='!py-2 text-sm'
                              />
                            </Table.Td>
                            <Table.Td className='p-2'>
                              <Button
                                type='button'
                                variant='light'
                                size='sm'
                                className='min-w-0 p-1.5 text-gray-400 hover:text-red-600'
                                onClick={() => remove(index)}
                              >
                                <IconTrash className='size-4' />
                              </Button>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  ) : (
                    <div className='px-4 py-8 text-center'>
                      <p className='text-sm text-gray-500'>No tasks added yet.</p>
                      <Button
                        type='button'
                        variant='light'
                        size='sm'
                        className='mt-2'
                        onClick={openTaskModal}
                      >
                        <IconPlus className='size-4 mr-1' />
                        Add Task
                      </Button>
                    </div>
                  )}
                </>
              )}
            </FieldArray>
          </div>

          {/* FOOTER BUTTON - z-20 so Update button stays on top of gallery/content */}
          <div className='fixed bottom-0 z-20 bg-neutral-100 flex -ml-5 w-[calc(100vw-7.2rem)] py-5 px-10 pr-8'>
            <Button radius='full' className='mt-auto ml-auto' type='submit' disabled={isSubmitting}>
              {isSubmitting
                ? mode === 'edit'
                  ? 'Updating...'
                  : 'Creating...'
                : mode === 'edit'
                  ? 'Update'
                  : 'Done'}
            </Button>
          </div>

          {/* Task Selector Sidebar */}
          <TaskSelectorSidebar
            isOpen={isTaskModalOpen}
            onClose={closeTaskModal}
            projectId={projectId}
            onAddTasks={(tasks) => {
              const currentTasks = values.taskSnapshots || [];
              const newTasks = tasks.map((task) => ({
                originalTaskId: task.originalTaskId,
                taskTitle: task.taskTitle,
                statusAtVisit: 'PENDING',
                notes: '',
                completionPercentage: 0,
                attachments: [],
              }));
              setFieldValue('taskSnapshots', [...currentTasks, ...newTasks]);
            }}
            onCreateTask={openAddTask}
          />

          {/* Create Task Sidebar - stackOnTop so it appears above Add Task sidebar */}
          <AddTaskSidebar
            isOpen={isAddTaskOpen}
            onClose={closeAddTask}
            phaseId={phaseId}
            fixedProjectId={projectId}
            stackOnTop
          />
        </Form>
      )}
    </Formik>
  );
};

export default SiteVisitForm;
