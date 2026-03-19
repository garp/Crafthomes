import { Form, Formik } from 'formik';
import { useState, lazy, useCallback, useMemo, useRef, useEffect } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { IconArrowLeft, IconChevronRight, IconTrash } from '@tabler/icons-react';

import {
  createMasterTaskSchema,
  type TCreateMasterTaskFormData,
} from '../../validators/masterTask';
import { priorityOptions } from '../../constants/common';
import FormInput from '../base/FormInput';
import FormInputNumber from '../base/FormInputNumber';
import FormLabel from '../base/FormLabel';
import { Button } from '../base';
import FormTextArea from '../base/FormTextArea';
import type { TFormProps } from '../../types/common.types';
import type { TOption } from '../../types/project';
import { getButtonText } from '../../utils/helper';
import MasterPhaseSelectorForTask from '../common/selectors/MasterPhaseSelectorForTask';
import AddEditMasterPhaseSidebar from './AddEditMasterPhaseSidebar';
import FormSelect from '../base/FormSelect';
import { useGetMasterTasksQuery } from '../../store/services/masterTask/masterTask';
import DrawerModal from '../base/DrawerModal';
import IconButton from '../base/button/IconButton';

const RichTextEditorDescription = lazy(() => import('../common/RichTextEditorDescription'));
const PrioritySelector = lazy(() => import('../common/selectors/PrioritySelector'));

type TMasterSubTaskFormValue = NonNullable<TCreateMasterTaskFormData['subTasks']>[number];

const normalizeSubTaskLinks = (subTasks: TMasterSubTaskFormValue[]) => {
  const validIds = new Set(subTasks.map((subTask) => subTask.id).filter(Boolean));

  return subTasks.map((subTask) => ({
    ...subTask,
    predecessorTaskId:
      subTask.predecessorTaskId && validIds.has(subTask.predecessorTaskId)
        ? subTask.predecessorTaskId
        : null,
  }));
};

const createEmptyMasterSubTask = (): TMasterSubTaskFormValue => ({
  id:
    globalThis.crypto?.randomUUID?.() ??
    `master-subtask-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: '',
  description: '',
  duration: null,
  predecessorTaskId: null,
  priority: 'MEDIUM',
  notes: '',
});

function MasterTemplateSubTaskItem({
  subTask,
  onClick,
  onDelete,
}: {
  subTask: TMasterSubTaskFormValue;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div>
      <div
        className='flex gap-2 items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors'
        onClick={onClick}
      >
        <div className='flex-1 flex items-center gap-2'>
          <IconChevronRight className='size-4 text-gray-400' />
          <span className='text-sm font-medium text-gray-700'>
            {subTask.name || 'Untitled Checklist'}
          </span>
        </div>
        <div className='flex items-center gap-2' onClick={(e) => e.stopPropagation()}>
          <IconButton type='button' onClick={onDelete}>
            <IconTrash className='text-text-subHeading size-5' />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

function MasterTemplateSubTaskSidebar({
  isOpen,
  onClose,
  subTask,
  predecessorOptions,
  onSave,
  disabled,
}: {
  isOpen: boolean;
  onClose: () => void;
  subTask: TMasterSubTaskFormValue | null;
  predecessorOptions: { label: string; value: string }[];
  onSave: (subTask: TMasterSubTaskFormValue) => void;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState<TMasterSubTaskFormValue | null>(subTask);
  const [nameError, setNameError] = useState<string | undefined>();

  useEffect(() => {
    setDraft(subTask);
    setNameError(undefined);
  }, [subTask, isOpen]);

  if (!draft) return null;

  const updateDraft = (updates: Partial<TMasterSubTaskFormValue>) => {
    setDraft((current) => (current ? { ...current, ...updates } : current));
  };

  const handleSave = () => {
    if (!draft.name?.trim()) {
      setNameError('Checklist name is required');
      return;
    }

    onSave({
      ...draft,
      name: draft.name.trim(),
      priority: draft.priority || 'MEDIUM',
    });
    onClose();
  };

  return (
    <DrawerModal opened={isOpen} onClose={onClose}>
      <div className='flex flex-col h-full'>
        <div className='sticky top-0 z-20 gap-10 py-3 px-3 border-b border-gray-200 flex items-center bg-bg-light'>
          <IconButton type='button' onClick={onClose}>
            <IconArrowLeft className='size-5 text-text-subHeading' />
          </IconButton>
          <h2 className='mx-auto font-semibold text-gray-900'>{draft.name || 'Checklist'}</h2>
        </div>

        <div className='flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6'>
          <FormInput
            placeholder='Type checklist name here'
            value={draft.name || ''}
            onChange={(e) => {
              updateDraft({ name: e.target.value });
              if (nameError) setNameError(undefined);
            }}
            error={nameError}
            required
          />

          <FormTextArea
            label='Description'
            placeholder='Checklist description'
            value={draft.description || ''}
            onChange={(e) => updateDraft({ description: e.target.value })}
          />

          <div className='flex items-center'>
            <FormLabel className='w-[40%]'>Duration</FormLabel>
            <div className='w-[60%]'>
              <FormInputNumber
                min={0}
                placeholder='Enter duration in days'
                value={draft.duration ?? ''}
                onChange={(value) =>
                  updateDraft({
                    duration:
                      value === '' || value === null || Number.isNaN(value) ? null : Number(value),
                  })
                }
              />
            </div>
          </div>

          <div className='flex items-center'>
            <FormLabel className='w-[40%]'>Priority</FormLabel>
            <FormSelect
              className='w-[60%]'
              placeholder='Select Priority'
              value={draft.priority || 'MEDIUM'}
              onChange={(value) => updateDraft({ priority: value || 'MEDIUM' })}
              options={priorityOptions}
            />
          </div>

          <div className='flex items-center'>
            <FormLabel className='w-[40%]'>Predecessor Task</FormLabel>
            <FormSelect
              searchable
              clearable
              className='w-[60%]'
              placeholder='Select predecessor checklist'
              value={draft.predecessorTaskId || null}
              onChange={(value) => updateDraft({ predecessorTaskId: value || null })}
              options={predecessorOptions}
            />
          </div>
        </div>

        <div className='sticky bottom-0 bg-bg-light border-t border-gray-200 px-4 py-4'>
          <Button
            radius='full'
            type='button'
            disabled={disabled}
            className='w-full'
            onClick={handleSave}
          >
            Save Checklist
          </Button>
        </div>
      </div>
    </DrawerModal>
  );
}

export default function MasterTaskForm({
  initialValues,
  onSubmit,
  disabled,
  mode,
  defaultData,
  projectTypeId,
  taskId,
  predecessorTaskName,
}: TFormProps<TCreateMasterTaskFormData> & {
  defaultData?: TOption[];
  projectTypeId?: string;
  taskId?: string;
  predecessorTaskName?: string;
}) {
  const [isOpenAddPhase, { open: openAddPhase, close: closeAddPhase }] = useDisclosure(false);
  const [isOpenSubTaskSidebar, { open: openSubTaskSidebar, close: closeSubTaskSidebar }] =
    useDisclosure(false);
  const [pendingPhaseName, setPendingPhaseName] = useState<string | null>(null);
  const [initialPhaseName, setInitialPhaseName] = useState<string | undefined>(undefined);
  const [activeSubTaskIndex, setActiveSubTaskIndex] = useState<number | null>(null);
  const [newSubTaskName, setNewSubTaskName] = useState('');
  const setFieldValueRef = useRef<((field: string, value: any) => void) | null>(null);
  const { data: masterTasksData } = useGetMasterTasksQuery({
    pageLimit: '100',
    ...(projectTypeId ? { projectTypeId } : {}),
  });

  const predecessorOptions = useMemo(() => {
    const options =
      masterTasksData?.masterTasks
        ?.filter((task) => task.id !== taskId)
        .map((task) => ({
          label: task.name,
          value: task.id,
        })) || [];

    if (
      initialValues.predecessorTaskId &&
      predecessorTaskName &&
      !options.some((task) => task.value === initialValues.predecessorTaskId)
    ) {
      options.unshift({
        label: predecessorTaskName,
        value: initialValues.predecessorTaskId,
      });
    }

    return options;
  }, [initialValues.predecessorTaskId, masterTasksData?.masterTasks, predecessorTaskName, taskId]);

  const setPhases = useCallback((val: string[]) => {
    if (setFieldValueRef.current) {
      setFieldValueRef.current('masterPhaseId', val);
    }
  }, []);

  function handleCreateFromSearch(phaseName: string) {
    setPendingPhaseName(phaseName);
    setInitialPhaseName(phaseName);
    openAddPhase();
  }

  function handlePhaseCreated(phaseName: string) {
    setPendingPhaseName(phaseName);
    setInitialPhaseName(undefined);
  }

  function handlePendingPhaseHandled() {
    setPendingPhaseName(null);
  }
  // const formik = useFormik<TCreateMasterTaskFormData>({
  //   enableReinitialize: true,
  //   initialValues,
  //   validationSchema: createMasterTaskSchema,
  //   onSubmit: async (data, { resetForm }) => onSubmit({ data, resetForm }),
  // });
  return (
    <>
      <Formik<TCreateMasterTaskFormData>
        enableReinitialize
        initialValues={initialValues}
        onSubmit={(values, { resetForm }) => onSubmit({ data: values, resetForm })}
        validationSchema={createMasterTaskSchema}
      >
        {({
          values,
          handleBlur,
          handleChange,
          handleSubmit,
          touched,
          errors,
          setFieldValue,
          setFieldTouched,
        }) => {
          // Update ref so stable callback can use setFieldValue
          setFieldValueRef.current = setFieldValue;
          const activeSubTask =
            activeSubTaskIndex !== null
              ? (values.subTasks || [])[activeSubTaskIndex] || null
              : null;

          return (
            <>
              <Form
                onSubmit={handleSubmit}
                className='px-6 pt-6 pb-3 space-y-6 flex flex-col h-[92vh]'
              >
                <div className='space-y-6'>
                  {/* Task Name */}
                  <div className='flex flex-col '>
                    <FormLabel className=''>Task Name</FormLabel>
                    <FormInput
                      disabled={disabled}
                      placeholder='Enter Task Name'
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      name='name'
                      className=''
                      error={touched.name && errors.name ? errors.name : undefined}
                    />
                  </div>
                  {/* PrioritySelector */}
                  <PrioritySelector
                    name='priority'
                    label='Priority'
                    value={values.priority}
                    onChange={(val) => setFieldValue('priority', val || '')}
                    onBlur={() => setFieldTouched('priority', true)}
                    className=''
                    error={touched.priority ? errors.priority : undefined}
                  />
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='flex flex-col'>
                      <FormLabel>Duration (Optional)</FormLabel>
                      <FormInputNumber
                        min={0}
                        placeholder='Enter duration in days'
                        value={values.duration ?? ''}
                        onBlur={() => setFieldTouched('duration', true)}
                        onChange={(value) =>
                          setFieldValue(
                            'duration',
                            value === '' || value === null || Number.isNaN(value)
                              ? null
                              : Number(value),
                          )
                        }
                        error={
                          touched.duration ? (errors.duration as string | undefined) : undefined
                        }
                      />
                    </div>
                    <div className='flex flex-col'>
                      <FormLabel>Predecessor (Optional)</FormLabel>
                      <FormSelect
                        searchable
                        clearable
                        placeholder='Select predecessor task'
                        value={values.predecessorTaskId || null}
                        onChange={(value) => setFieldValue('predecessorTaskId', value || null)}
                        options={predecessorOptions}
                        error={
                          touched.predecessorTaskId
                            ? (errors.predecessorTaskId as string | undefined)
                            : undefined
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <FormLabel>Checklists</FormLabel>
                    <FormInput
                      placeholder='Type checklist name and press Enter'
                      className='w-full mt-2'
                      value={newSubTaskName}
                      disabled={disabled}
                      onChange={(e) => setNewSubTaskName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;
                        e.preventDefault();

                        const subtaskName = newSubTaskName.trim();
                        if (!subtaskName) return;

                        const nextSubTasks = normalizeSubTaskLinks([
                          ...(values.subTasks || []),
                          {
                            ...createEmptyMasterSubTask(),
                            name: subtaskName,
                          },
                        ]);

                        setFieldValue('subTasks', nextSubTasks);
                        setNewSubTaskName('');
                      }}
                      rightSection={
                        <IconButton
                          type='button'
                          onClick={() => {
                            const subtaskName = newSubTaskName.trim();
                            if (!subtaskName) return;

                            const nextSubTasks = normalizeSubTaskLinks([
                              ...(values.subTasks || []),
                              {
                                ...createEmptyMasterSubTask(),
                                name: subtaskName,
                              },
                            ]);

                            setFieldValue('subTasks', nextSubTasks);
                            setNewSubTaskName('');
                          }}
                        >
                          <IconChevronRight className='size-4' />
                        </IconButton>
                      }
                    />

                    <div className='space-y-3 mt-4'>
                      {(values.subTasks || []).length > 0
                        ? (values.subTasks || []).map((subTask, index) => (
                            <MasterTemplateSubTaskItem
                              key={subTask.id || index}
                              subTask={subTask}
                              onClick={() => {
                                setActiveSubTaskIndex(index);
                                openSubTaskSidebar();
                              }}
                              onDelete={() => {
                                const removedSubTaskId = (values.subTasks || [])[index]?.id;
                                const nextSubTasks = normalizeSubTaskLinks(
                                  (values.subTasks || []).filter(
                                    (_, subTaskIndex) => subTaskIndex !== index,
                                  ),
                                ).map((item) =>
                                  item.predecessorTaskId === removedSubTaskId
                                    ? { ...item, predecessorTaskId: null }
                                    : item,
                                );

                                setFieldValue('subTasks', nextSubTasks);

                                if (activeSubTaskIndex === index) {
                                  setActiveSubTaskIndex(null);
                                  closeSubTaskSidebar();
                                }
                              }}
                            />
                          ))
                        : null}
                    </div>
                  </div>

                  {/* Phase Selector */}
                  <div className='flex flex-col'>
                    <FormLabel className='w-[40%]'>Select Phase (Optional)</FormLabel>
                    <MasterPhaseSelectorForTask
                      value={values.masterPhaseId}
                      setValue={setPhases}
                      error={touched.masterPhaseId ? errors.masterPhaseId : undefined}
                      defaultData={defaultData}
                      projectTypeId={projectTypeId}
                      onCreateFromSearch={handleCreateFromSearch}
                      pendingPhaseName={pendingPhaseName}
                      onPendingPhaseHandled={handlePendingPhaseHandled}
                    />
                  </div>

                  {/* Description */}
                  <div className='flex flex-col'>
                    <FormLabel className='w-[40%]'>Description</FormLabel>
                    <RichTextEditorDescription
                      setValue={(val) => setFieldValue('description', val)}
                      value={values.description}
                      imageFolder='estatecraft-master-task-images'
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  radius='full'
                  type='submit'
                  disabled={disabled}
                  className='mt-auto px-9 ml-auto'
                >
                  {getButtonText('', disabled, mode)}
                </Button>
              </Form>

              <MasterTemplateSubTaskSidebar
                isOpen={isOpenSubTaskSidebar}
                onClose={() => {
                  closeSubTaskSidebar();
                  setActiveSubTaskIndex(null);
                }}
                subTask={activeSubTask}
                predecessorOptions={(values.subTasks || [])
                  .filter((_, index) => index !== activeSubTaskIndex)
                  .map((item, index) => ({
                    label: item.name || `Checklist ${index + 1}`,
                    value: item.id || '',
                  }))
                  .filter((option) => option.value)}
                onSave={(updatedSubTask) => {
                  if (activeSubTaskIndex === null) return;

                  const nextSubTasks = [...(values.subTasks || [])];
                  nextSubTasks[activeSubTaskIndex] = updatedSubTask;
                  setFieldValue('subTasks', normalizeSubTaskLinks(nextSubTasks));
                }}
                disabled={disabled}
              />
            </>
          );
        }}
      </Formik>

      {/* Add Phase Sidebar */}
      <AddEditMasterPhaseSidebar
        isOpen={isOpenAddPhase}
        onClose={() => {
          closeAddPhase();
          setInitialPhaseName(undefined);
        }}
        onSuccess={handlePhaseCreated}
        mode='create'
        initialPhaseName={initialPhaseName}
        projectTypeId={projectTypeId}
      />
    </>
  );
}
