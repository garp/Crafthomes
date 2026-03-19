import { useFormik } from 'formik';
// import { useDeleteFileMutation, useUploadFilesMutation } from '../../store/services/upload/upload';
import { createProjectSchema } from '../../validators/project.validator';
import { useGetClientsQuery } from '../../store/services/client/clientSlice';

import type { TFormProps } from '../../types/common.types';
import type { TClient } from '../../store/types/client.types';
import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
// import IconButton from '../base/button/IconButton';
// import Spinner from '../common/loaders/Spinner';
// import type { TAttachment, TErrorResponse } from '../../store/types/common.types';
import { toast } from 'react-toastify';
// import { cn } from '../../utils/helper';
// import { CloseIcon } from '@mantine/core';
import { Button } from '../base';
// import { IconFile } from '@tabler/icons-react';

import { FormFieldSkeleton } from '../base/Skeletons';
import FormInput from '../base/FormInput';
import FormDate from '../base/FormDate';
import FormSelect from '../base/FormSelect';
import ProjectManagerSelector from '../common/selectors/ProjectManagerSelector';
import { CURRENCIES } from '../../constants/project';
import ClientSelector from '../common/selectors/ClientSelector';
import ClientContactSelector from '../common/selectors/ClientContactSelector';
import InternalUsersMultiSelect from '../common/selectors/InternalUsersMultiSelect';
import type { TProjectFormInitialValues } from '../../types/project';
import FormAttachment from '../base/FormAttachment';
import RichTextEditorDescription from '../common/RichTextEditorDescription';
import FormLabel from '../base/FormLabel';
import { numberToWords } from '../../utils/helper';
// import { cn } from '../../utils/helper';
// const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function ProjectForm({
  disabled: isSubmitting,
  initialValues,
  onSubmit,
  onClose,
  mode,
  defaultClientName,
  onDirtyChange,
}: TFormProps<TProjectFormInitialValues> & {
  defaultClientName?: string;
  defaultProjectTypes?: { id: string; name: string }[];
  onDirtyChange?: (isDirty: boolean) => void;
}) {
  //   const [createProject, { isLoading: isCreatingProject }] = useCreateProjectMutation();
  // const [uploadFiles, { isLoading: isUploadingFiles }] = useUploadFilesMutation();
  // const [deleteFile, { isLoading: isDeletingFile }] = useDeleteFileMutation();

  const formik = useFormik<TProjectFormInitialValues>({
    initialValues,
    validationSchema: createProjectSchema,
    onSubmit: (data, { resetForm }) => onSubmit({ data, resetForm }),
  });

  // Track dirty state changes
  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(formik.dirty);
    }
  }, [formik.dirty, onDirtyChange]);

  // Track previous clientId to detect changes
  const prevClientIdRef = useRef<string | null>(formik.values.clientId);

  // Get clients data to access address information
  const { data: clientsData } = useGetClientsQuery({ pageLimit: '1000' });
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const mapAddressToOption = (
    address: NonNullable<TClient['addresses']>[number],
    index: number,
  ): { label: string; value: string; address: NonNullable<TClient['addresses']>[number] } => {
    const parts = [
      address.label,
      address.building,
      address.street,
      address.locality,
      address.landmark,
      address.city,
      address.state,
      address.pincode,
    ].filter(Boolean);
    const label = parts.join(', ') || 'Address';
    const value = address.id ?? String(index);
    return { label, value, address };
  };

  const applyAddressFields = useCallback(
    (address: NonNullable<TClient['addresses']>[number]) => {
      const addressLine = [address.building, address.street, address.locality, address.landmark]
        .filter(Boolean)
        .join(', ');
      formik.setFieldValue('address', addressLine);
      formik.setFieldValue('state', address.state || '');
      formik.setFieldValue('city', address.city || '');
    },
    // formik ref is stable; listing formik causes unnecessary re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formik.setFieldValue],
  );

  // Match existing address from initialValues with client's addresses when editing
  useEffect(() => {
    // Only run in edit mode when we have client data and an existing address
    if (
      mode === 'edit' &&
      !selectedAddressId &&
      formik.values.clientId &&
      clientsData?.clients &&
      (formik.values.address || formik.values.city || formik.values.state)
    ) {
      const selectedClient = clientsData.clients.find(
        (client) => client.id === formik.values.clientId,
      );

      if (selectedClient?.addresses && selectedClient.addresses.length > 0) {
        const addressOptions = selectedClient.addresses.map(mapAddressToOption);

        // Try to match the existing address with client's addresses
        // Match by comparing the address line, city, and state
        const existingAddressLine = formik.values.address || '';
        const existingCity = formik.values.city || '';
        const existingState = formik.values.state || '';

        const matchedOption = addressOptions.find((option) => {
          const optionAddressLine = [
            option.address.building,
            option.address.street,
            option.address.locality,
            option.address.landmark,
          ]
            .filter(Boolean)
            .join(', ');

          return (
            optionAddressLine === existingAddressLine &&
            option.address.city === existingCity &&
            option.address.state === existingState
          );
        });

        if (matchedOption) {
          setSelectedAddressId(matchedOption.value);
        }
      }
    }
  }, [
    mode,
    selectedAddressId,
    formik.values.clientId,
    formik.values.address,
    formik.values.city,
    formik.values.state,
    clientsData,
  ]);

  // Auto-fill address, state, and city when client is selected
  useEffect(() => {
    const currentClientId = formik.values.clientId;
    const prevClientId = prevClientIdRef.current;

    // If client changed (including when it becomes null), clear the contacts
    if (currentClientId !== prevClientId) {
      formik.setFieldValue('assignClientContact', []);
      prevClientIdRef.current = currentClientId;
      setSelectedAddressId(null);
    }

    if (currentClientId && clientsData?.clients) {
      const selectedClient = clientsData.clients.find((client) => client.id === currentClientId);

      if (selectedClient?.addresses && selectedClient.addresses.length > 0) {
        const addressOptions = selectedClient.addresses.map(mapAddressToOption);
        const hasMultipleAddresses = addressOptions.length > 1;

        // Only auto-select if there's a single address or if an address was already selected
        if (hasMultipleAddresses) {
          // Multiple addresses: only apply if one is already selected, otherwise clear fields and let user choose
          if (selectedAddressId) {
            const matchedAddress = addressOptions.find(
              (option) => option.value === selectedAddressId,
            );
            if (matchedAddress) {
              applyAddressFields(matchedAddress.address);
            } else {
              // Selected address ID doesn't match any option (e.g., from previous client), clear fields but keep selectedAddressId null
              // But don't clear if we're in edit mode and have existing address values (they might be matched in the other useEffect)
              if (
                mode !== 'edit' ||
                (!formik.values.address && !formik.values.city && !formik.values.state)
              ) {
                formik.setFieldValue('address', '');
                formik.setFieldValue('state', '');
                formik.setFieldValue('city', '');
              }
            }
          } else {
            // No address selected yet, clear fields to prompt user selection (but don't set selectedAddressId to null again)
            // But don't clear if we're in edit mode and have existing address values (they might be matched in the other useEffect)
            if (
              mode !== 'edit' ||
              (!formik.values.address && !formik.values.city && !formik.values.state)
            ) {
              formik.setFieldValue('address', '');
              formik.setFieldValue('state', '');
              formik.setFieldValue('city', '');
            }
          }
          // Don't auto-select - let user choose
        } else {
          // Single address: auto-select and apply
          const matchedAddress = addressOptions[0];
          if (matchedAddress.value !== selectedAddressId) {
            setSelectedAddressId(matchedAddress.value);
          }
          applyAddressFields(matchedAddress.address);
        }
        return;
      }
    }

    // Only clear if we actually need to (when clientId exists but no addresses)
    if (
      currentClientId &&
      (!clientsData?.clients ||
        !clientsData.clients.find((client) => client.id === currentClientId)?.addresses?.length)
    ) {
      formik.setFieldValue('address', '');
      formik.setFieldValue('state', '');
      formik.setFieldValue('city', '');
      if (selectedAddressId !== null) {
        setSelectedAddressId(null);
      }
    } else if (!currentClientId) {
      // No client selected, clear everything
      formik.setFieldValue('address', '');
      formik.setFieldValue('state', '');
      formik.setFieldValue('city', '');
      if (selectedAddressId !== null) {
        setSelectedAddressId(null);
      }
    }
    // formik ref is stable; listing formik causes unnecessary re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formik.values.clientId,
    clientsData,
    selectedAddressId,
    applyAddressFields,
    formik.setFieldValue,
    mode,
  ]);

  // const currencyOptions = useCurrencyOptions();
  const disabled = isSubmitting;
  const selectedClient =
    clientsData?.clients.find((client) => client.id === formik.values.clientId) || null;
  const addressOptions =
    selectedClient?.addresses?.map((address, index) => {
      const option = mapAddressToOption(address, index);
      return { label: option.label, value: option.value };
    }) || [];
  const hasMultipleAddresses = addressOptions.length > 1;

  // Duration state for auto-calculating end date
  const [duration, setDuration] = useState<number | ''>(() => {
    // Pre-fill duration in edit mode when both dates are present
    if (mode === 'edit' && initialValues.startDate && initialValues.endDate) {
      const start = new Date(initialValues.startDate);
      const end = new Date(initialValues.endDate);
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      // Duration = difference in days (end - start)
      return diffDays >= 0 ? diffDays : '';
    }
    return '';
  });

  // function handleAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
  //   const files = e.target.files;
  //   if (!files) return;
  //   if (files.length > 5 || formik.values?.attachments?.length || 0 + files.length > 5)
  //     return toast.error('Maximum 5 files allowed');

  //   const formData = new FormData();
  //   for (const file of files) {
  //     if (file.size > MAX_FILE_SIZE) return toast.error('File size must be <10MB');
  //     formData.append('files', file);
  //   }
  //   formData.append('folder', 'estatecraft-project-attachments');
  //   uploadFiles(formData)
  //     .unwrap()
  //     .then((res) => {
  //       const uploaded = res?.data?.files || [];
  //       formik.setFieldValue('attachments', [...(formik.values?.attachments || []), ...uploaded]);
  //     });
  // }

  // function removeAttachment(attachment: TAttachment) {
  //   deleteFile({ key: attachment.key })
  //     .unwrap()
  //     .catch((error: { data: TErrorResponse }) =>
  //       toast.error(error?.data?.message || 'Unable to delete file'),
  //     );
  //   formik.setFieldValue(
  //     'attachment',
  //     formik.values.attachments?.filter((a) => a.key !== attachment.key),
  //   );
  // }
  // console.log({ f: formik.errors });
  return (
    <>
      <form onSubmit={formik.handleSubmit} className='flex flex-col '>
        <div className='grid grid-cols-2 gap-y-4 gap-x-6 mt-3 flex-1 overflow-y-auto px-5 pb-5'>
          <FormInput
            disabled={disabled}
            name='name'
            placeholder='Name of the project'
            label='Project name*'
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.name ? formik.errors.name : undefined}
          />
          {/* Client */}
          <Suspense fallback={<FormFieldSkeleton label='Client' />}>
            <ClientSelector
              label='Client'
              defaultSearchValue={defaultClientName}
              disabled={disabled}
              value={formik.values.clientId}
              setValue={(val) => formik.setFieldValue('clientId', val)}
              error={formik.touched.clientId ? formik.errors.clientId : undefined}
              className='w-full'
            />
          </Suspense>
          {/* PROJECT ADDRESS */}
          <div className='col-span-2'>
            {hasMultipleAddresses ? (
              <FormSelect
                disabled={disabled}
                name='address'
                placeholder='Select address'
                label='Address*'
                value={selectedAddressId}
                onChange={(val) => {
                  setSelectedAddressId(val);
                  // Apply the selected address fields
                  if (val && selectedClient?.addresses) {
                    const addressOptions = selectedClient.addresses.map(mapAddressToOption);
                    const selectedOption = addressOptions.find((option) => option.value === val);
                    if (selectedOption) {
                      applyAddressFields(selectedOption.address);
                    }
                  }
                }}
                options={addressOptions}
                onBlur={formik.handleBlur}
                error={formik.touched.address ? formik.errors.address : undefined}
              />
            ) : (
              <FormInput
                disabled={true}
                name='address'
                placeholder='Address will be auto-filled from client'
                label='Address*'
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.address ? formik.errors.address : undefined}
                styles={{
                  input: {
                    color: '#111827',
                    opacity: 1,
                  },
                }}
              />
            )}
          </div>
          {/* State */}
          {!hasMultipleAddresses ? (
            <>
              <FormInput
                disabled={true}
                name='state'
                placeholder='State will be auto-filled from client'
                label='State*'
                value={formik.values.state || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.state ? formik.errors.state : undefined}
                styles={{
                  input: {
                    color: '#111827',
                    opacity: 1,
                  },
                }}
              />
              {/* City */}
              <FormInput
                disabled={true}
                name='city'
                placeholder='City will be auto-filled from client'
                label='City*'
                value={formik.values.city || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.city ? formik.errors.city : undefined}
                styles={{
                  input: {
                    color: '#111827',
                    opacity: 1,
                  },
                }}
              />
            </>
          ) : (
            <></>
          )}
          {/* Currency */}
          <FormSelect
            // searchable
            disabled={disabled}
            options={CURRENCIES}
            name='currency'
            placeholder='Enter currency'
            label='Currency*'
            value={formik.values.currency}
            onChange={(val) => formik.setFieldValue('currency', val)}
            onBlur={formik.handleBlur}
            error={formik.touched.currency ? formik.errors.currency : undefined}
          />
          {/* Project Estimation */}
          <div className='flex flex-col gap-1'>
            <FormInput
              disabled={disabled}
              name='estimatedBudget'
              type='text'
              placeholder='Enter project estimation'
              label='Estimated Budget'
              value={
                formik.values.estimatedBudget
                  ? formik.values.estimatedBudget.toLocaleString('en-IN')
                  : ''
              }
              onChange={(e) => {
                const value = e.target.value.replace(/,/g, ''); // Remove commas for parsing
                // Only allow numbers and empty string
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  const numValue = value === '' ? 0 : parseFloat(value) || 0;
                  formik.setFieldValue('estimatedBudget', numValue);
                }
              }}
              onBlur={formik.handleBlur}
              error={formik.touched.estimatedBudget ? formik.errors.estimatedBudget : undefined}
            />
            {formik.values.estimatedBudget && formik.values.estimatedBudget > 0 ? (
              <div className='mt-1'>
                <span className='text-xs text-gray-600 italic'>
                  {numberToWords(formik.values.estimatedBudget)} Rupees Only
                </span>
              </div>
            ) : null}
          </div>
          {/* Duration */}
          <FormInput
            disabled={disabled}
            name='duration'
            type='number'
            placeholder='Enter number of days'
            label='Duration (days)'
            value={duration}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setDuration('');
                // When user clears duration explicitly, also clear end date
                formik.setFieldValue('endDate', null);
                return;
              }
              const parsed = parseInt(value, 10);
              if (!Number.isNaN(parsed) && parsed >= 1) {
                setDuration(parsed);
                if (formik.values.startDate) {
                  const startDate = new Date(formik.values.startDate);
                  const endDate = new Date(startDate);
                  // Duration 1 = same day, Duration 2 = next day, etc.
                  endDate.setDate(startDate.getDate() + (parsed - 1));
                  // Set end date with time as 23:59:59 (end of day)
                  endDate.setHours(23, 59, 59, 999);
                  formik.setFieldValue('endDate', endDate);
                }
              }
            }}
            min={1}
          />
          {/* Assign Project manager */}
          <Suspense fallback={<FormFieldSkeleton label='Assign Project Manager*' />}>
            <ProjectManagerSelector
              label='Assign Project Manager*'
              allowFilter={false}
              setValue={(val) => formik.setFieldValue('assignProjectManager', val)}
              value={formik.values.assignProjectManager || ''}
              disabled={disabled}
              error={
                formik.touched.assignProjectManager ? formik.errors.assignProjectManager : undefined
              }
              className='w-full'
            />
          </Suspense>
          {/* Start date */}
          <FormDate
            disabled={disabled}
            name='startDate'
            placeholder='Project start date'
            label='Start date*'
            value={formik.values.startDate}
            onChange={(val) => {
              formik.setFieldValue('startDate', val);
              // If there's an end date, recalculate duration; otherwise use duration to calculate end date
              if (val) {
                if (formik.values.endDate) {
                  // End date exists, recalculate duration (inclusive counting)
                  const startDate = new Date(val);
                  const endDate = new Date(formik.values.endDate);
                  const diffMs = endDate.getTime() - startDate.getTime();
                  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
                  // Duration = difference in days (end - start)
                  setDuration(diffDays >= 0 ? diffDays : '');
                } else if (duration) {
                  // No end date, use duration to calculate end date
                  const startDate = new Date(val);
                  const endDate = new Date(startDate);
                  // Duration N = end date is N days after start
                  endDate.setDate(startDate.getDate() + Number(duration));
                  // Set end date with time as 23:59:59 (end of day)
                  endDate.setHours(23, 59, 59, 999);
                  formik.setFieldValue('endDate', endDate);
                }
              }
            }}
            onBlur={() => formik.setFieldTouched('startDate', true)}
            error={
              formik.touched.startDate ? (formik.errors.startDate as string | undefined) : undefined
            }
          />
          {/* Completion date */}
          <FormDate
            disabled={disabled}
            name='endDate'
            placeholder='Estimated completion date'
            label='Completion date'
            value={formik.values.endDate}
            onChange={(val) => {
              // Validate that end date is not before start date (but same day is allowed)
              if (val && formik.values.startDate) {
                const startDate = new Date(formik.values.startDate);
                startDate.setHours(0, 0, 0, 0);
                const endDateCheck = new Date(val);
                endDateCheck.setHours(0, 0, 0, 0);
                if (endDateCheck < startDate) {
                  toast.error('Completion date cannot be before start date');
                  return; // Don't set the invalid date
                }
              }

              // Set end date with time as 23:59:59 (end of day)
              if (val) {
                const endDateWithTime = new Date(val);
                endDateWithTime.setHours(23, 59, 59, 999);
                formik.setFieldValue('endDate', endDateWithTime);
              } else {
                formik.setFieldValue('endDate', val);
              }

              // Calculate and override duration when end date is selected (inclusive counting)
              if (val && formik.values.startDate) {
                const startDate = new Date(formik.values.startDate);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(val);
                endDate.setHours(0, 0, 0, 0);
                const diffMs = endDate.getTime() - startDate.getTime();
                const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
                // Duration = difference in days (end - start)
                setDuration(diffDays >= 0 ? diffDays : '');
              } else {
                setDuration('');
              }
            }}
            onBlur={() => formik.setFieldTouched('endDate', true)}
            error={
              formik.touched.endDate ? (formik.errors.endDate as string | undefined) : undefined
            }
          />
          {/* Assign Team Members (Internal Users) */}
          <div className='col-span-full'>
            <Suspense fallback={<FormFieldSkeleton label='Assign Team Members' />}>
              <InternalUsersMultiSelect
                label='Assign Team Members'
                setValue={(val) => formik.setFieldValue('assignedInternalUsersId', val)}
                value={formik.values.assignedInternalUsersId || []}
                disabled={disabled}
                error={
                  formik.touched.assignedInternalUsersId
                    ? (Array.isArray(formik.errors.assignedInternalUsersId)
                        ? formik.errors.assignedInternalUsersId.join(', ')
                        : formik.errors.assignedInternalUsersId) || undefined
                    : undefined
                }
                className='w-full'
              />
            </Suspense>
          </div>
          {/* Assign client contact - only show when client is selected */}
          {formik.values.clientId && (
            <div className='col-span-full'>
              <Suspense fallback={<FormFieldSkeleton label='Assign Client Contact' />}>
                <ClientContactSelector
                  label='Assign Client Contact'
                  clientId={formik.values.clientId}
                  setValue={(val) => formik.setFieldValue('assignClientContact', val)}
                  value={formik.values.assignClientContact || []}
                  disabled={disabled}
                  error={
                    formik.touched.assignClientContact
                      ? (Array.isArray(formik.errors.assignClientContact)
                          ? formik.errors.assignClientContact.join(', ')
                          : formik.errors.assignClientContact) || undefined
                      : undefined
                  }
                  className='w-full'
                />
              </Suspense>
            </div>
          )}
          {/* PROJECT DESCRIPTION */}
          <hr className='col-span-full border mt-2' />
          <div className='col-span-full'>
            <FormLabel>Description</FormLabel>
            <RichTextEditorDescription
              value={formik.values.description || ''}
              setValue={(val) => formik.setFieldValue('description', val)}
              imageFolder='estatecraft-project-description-images'
            />
          </div>
          {/* Attachment full width */}
          <FormAttachment
            iconWrapperClassName='py-2 text-center text-text-subHeading font-medium border-none bg-neutral-100 w-full aria-disabled:pointer-events-none cursor-pointer aria-disabled:opacity-70 aria-disabled:cursor-not-allowed'
            icon={<>Attachments</>}
            label=''
            currentAttachments={formik.values.attachments}
            onUpload={(attachments) => formik.setFieldValue('attachments', attachments)}
            folderName='estatecraft-project-attachments'
            inputId='project-attachments'
            multiple
            className='col-span-full'
          />
          {/* <div className='flex flex-col col-span-2'>
            <label
              aria-disabled={disabled}
              className={cn(
                'py-3 text-center text-text-subHeading font-medium border-none bg-neutral-100 w-full',
                'aria-disabled:pointer-events-none cursor-pointer aria-disabled:opacity-70 aria-disabled:cursor-not-allowed',
              )}
              htmlFor='actual-btn'
            >
              Attachment
            </label>
            <input multiple onChange={handleAttachmentChange} type='file' id='actual-btn' hidden />
          </div> */}
          {/* Attachment details */}
          {/* <>
            {formik.values?.attachments &&
              formik.values.attachments?.map((attachment) => (
                <div key={attachment?.key} className='flex gap-3 items-center'>
                  {isDeletingFile ? (
                    <Spinner />
                  ) : (
                    <IconButton disabled={disabled} onClick={() => removeAttachment(attachment)}>
                      <CloseIcon size='16' />
                    </IconButton>
                  )}
                  <div>
                    {attachment?.type === 'image' ? (
                      <Image
                        className='h-16 w-auto object-contain'
                        src={attachment?.url}
                        alt={attachment?.name}
                        height={100}
                        width={100}
                      />
                    ) : (
                      <IconFile className='size-14 text-text-subHeading' />
                    )}
                    <p className='text-sm line-clamp-1 text-gray-600'>{attachment?.name}</p>
                  </div>
                </div>
              ))}
          </> */}
        </div>
        <div className='flex justify-end gap-3 pt-5 border-t z-10 px-5 sticky bottom-0 bg-bg-light py-5'>
          <Button
            disabled={disabled}
            className='px-7 bg-white'
            radius='full'
            type='button'
            variant='outline'
            onClick={onClose}
          >
            Close
          </Button>
          <Button disabled={disabled} radius='full' type='submit'>
            {mode === 'create'
              ? disabled
                ? 'Creating...'
                : 'Create Project'
              : disabled
                ? 'Updating...'
                : 'Update'}
          </Button>
        </div>
      </form>
    </>
  );
}
