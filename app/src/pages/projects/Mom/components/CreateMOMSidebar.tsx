import { useFormik } from 'formik';
import { useEffect, useMemo, useState } from 'react';
import { IconX } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import type { TCreateMOMSidebarProps } from '../types/types';
import type { TMOMAttachment } from '../../../../store/types/mom.types';
import type { TAttachment } from '../../../../store/types/common.types';
import type { TErrorResponse } from '../../../../store/types/common.types';
import type { ComboboxItem, ComboboxItemGroup } from '@mantine/core';

import DrawerModal from '../../../../components/base/DrawerModal';
import FormDate from '../../../../components/base/FormDate';
import FormInput from '../../../../components/base/FormInput';
import FormSelect from '../../../../components/base/FormSelect';
import FormAttachment from '../../../../components/base/FormAttachment';
import SearchableCombobox from '../../../../components/common/SearchableCombobox';
import { Button, Image } from '../../../../components';
import { createMOMSchema } from '../../../../validators/mom';
import FormLabel from '../../../../components/base/FormLabel';
import { HELD_ON_OPTIONS, HeldOn } from '../../../../constants/mom';
import {
  useCreateMOMMutation,
  useUpdateMOMMutation,
  useDeleteMOMMutation,
} from '../../../../store/services/mom/mom';
import {
  useGetUsersQuery,
  useLazyGetSearchedUsersQuery,
} from '../../../../store/services/user/userSlice';
import MeetingPurposeEditor from './MeetingPurposeEditor';
import AlertModal from '../../../../components/base/AlertModal';

export default function CreateMOMSidebar({
  closeSidebar,
  isOpenSidebar,
  initialValues,
  mode = 'create',
  projectId,
}: TCreateMOMSidebarProps) {
  const [createMOM, { isLoading: isCreating }] = useCreateMOMMutation();
  const [updateMOM, { isLoading: isUpdating }] = useUpdateMOMMutation();
  const [deleteMOM, { isLoading: isDeleting }] = useDeleteMOMMutation();
  const [attendeesTouched, setAttendeesTouched] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Get initial users for attendees
  const { data: initialUsersData } = useGetUsersQuery({
    projectId: projectId || undefined,
    pageLimit: '100',
  });
  const [triggerSearchUsers, { data: searchedUsersData, isFetching: isSearchingUsers }] =
    useLazyGetSearchedUsersQuery();

  // Check if heldOn value is a predefined option or a custom value
  const PREDEFINED_HELD_ON_VALUES = Object.values(HeldOn);
  const isPredefinedHeldOn = (value: string) => PREDEFINED_HELD_ON_VALUES.includes(value as HeldOn);

  // Get initial heldOn and otherHeldOn values for edit mode
  const getInitialHeldOnValues = () => {
    if (mode === 'edit' && initialValues?.heldOn) {
      // If the stored value is a predefined option, use it directly
      if (isPredefinedHeldOn(initialValues.heldOn)) {
        return {
          heldOn: initialValues.heldOn,
          otherHeldOn: '',
        };
      }
      // If it's a custom value, set heldOn to 'OTHER' and otherHeldOn to the custom value
      return {
        heldOn: HeldOn.OTHER,
        otherHeldOn: initialValues.heldOn,
      };
    }
    return {
      heldOn: '',
      otherHeldOn: '',
    };
  };

  // Map users to options
  const mapUsersToOptions = (data: typeof initialUsersData) => {
    return data?.users?.map((user) => ({ label: user.name, value: user.id })) || [];
  };

  // Get initial attendee IDs and default data for edit mode
  const initialAttendeeIds = useMemo(() => {
    if (mode === 'edit' && initialValues?.momAttendees) {
      return initialValues.momAttendees.map(
        (attendee: { user: { id: string } }) => attendee.user.id,
      );
    }
    return [];
  }, [mode, initialValues]);

  const defaultAttendeeData = useMemo(() => {
    if (mode === 'edit' && initialValues?.momAttendees) {
      return initialValues.momAttendees.map((attendee: { user: { id: string; name: string } }) => ({
        label: attendee.user.name,
        value: attendee.user.id,
      }));
    }
    return undefined;
  }, [mode, initialValues]);

  // Convert TAttachment to TMOMAttachment format
  // Note: Upload API returns more fields than TAttachment type defines, so we preserve all fields
  const convertAttachmentToMOMAttachment = (
    attachment: TAttachment | TMOMAttachment,
  ): TMOMAttachment => {
    return {
      url: attachment.url,
      name: attachment.name,
      key: attachment.key,
      type: attachment.type,
      size: (attachment as any).size,
      mimeType: (attachment as any).mimeType,
      createdAt: (attachment as any).createdAt,
      updatedAt: (attachment as any).updatedAt,
      createdBy: (attachment as any).createdBy,
      updatedBy: (attachment as any).updatedBy,
    };
  };

  const initialHeldOnValues = getInitialHeldOnValues();

  const formik = useFormik({
    initialValues: {
      title: initialValues?.title || '',
      startDate: initialValues?.startDate ? new Date(initialValues.startDate) : null,
      attendees: initialAttendeeIds,
      heldOn: initialHeldOnValues.heldOn,
      otherHeldOn: initialHeldOnValues.otherHeldOn,
      purpose: initialValues?.purpose || '',
      attachments: initialValues?.attachments
        ? initialValues.attachments.map(convertAttachmentToMOMAttachment)
        : [],
    },
    validationSchema: createMOMSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      if (!projectId) {
        toast.error('Project ID is missing');
        setSubmitting(false);
        return;
      }

      // Convert attachments to API format
      const apiAttachments: TMOMAttachment[] = values.attachments.map((att: TMOMAttachment) => ({
        url: att.url,
        name: att.name,
        key: att.key,
        type: att.type,
        size: att.size,
        mimeType: att.mimeType,
        createdAt: att.createdAt,
        updatedAt: att.updatedAt,
        createdBy: att.createdBy,
        updatedBy: att.updatedBy,
      }));

      // Convert startDate to ISO string - handle both Date objects and strings
      let startDateISO = '';
      if (values.startDate) {
        if (values.startDate instanceof Date) {
          startDateISO = values.startDate.toISOString();
        } else if (typeof values.startDate === 'string') {
          // If it's already a string, convert to Date first, then to ISO string
          const dateObj = new Date(values.startDate);
          if (!isNaN(dateObj.getTime())) {
            startDateISO = dateObj.toISOString();
          } else {
            // If string is not a valid date, use it as is (might be ISO string already)
            startDateISO = values.startDate;
          }
        }
      }

      // If "Other" is selected, pass the custom platform name in heldOn directly
      const heldOnValue = values.heldOn === HeldOn.OTHER ? values.otherHeldOn : values.heldOn;

      const payload = {
        title: values.title,
        projectId,
        purpose: values.purpose,
        heldOn: heldOnValue,
        startDate: startDateISO,
        attachments: apiAttachments,
        attendeeIds: values.attendees,
      };

      try {
        if (mode === 'edit' && initialValues?.id) {
          await updateMOM({ id: initialValues.id, ...payload }).unwrap();
          toast.success('MOM updated successfully');
        } else {
          await createMOM(payload).unwrap();
          toast.success('MOM created successfully');
        }
        closeSidebar();
        formik.resetForm();
        setSubmitting(false);
      } catch (error: unknown) {
        const err = error as { data?: TErrorResponse };
        if (err?.data?.message) {
          toast.error(err.data.message);
        } else {
          toast.error(mode === 'edit' ? 'Failed to update MOM' : 'Failed to create MOM');
        }
        setSubmitting(false);
      }
    },
  });

  // Track dirty state
  const isDirty = useMemo(() => {
    if (mode === 'create') {
      // In create mode, button should be enabled when form has values
      return (
        formik.values.title !== '' ||
        formik.values.startDate !== null ||
        formik.values.attendees.length > 0 ||
        formik.values.heldOn !== '' ||
        formik.values.purpose !== '' ||
        formik.values.attachments.length > 0
      );
    }

    // Edit mode - compare with initial values
    const initialTitle = initialValues?.title || '';
    const initialStartDate = initialValues?.startDate ? new Date(initialValues.startDate) : null;
    const initialAttendees = initialAttendeeIds;
    const initialPurpose = initialValues?.purpose || '';
    const initialAttachments = initialValues?.attachments
      ? initialValues.attachments.map(convertAttachmentToMOMAttachment)
      : [];

    return (
      formik.values.title !== initialTitle ||
      formik.values.startDate?.getTime() !== initialStartDate?.getTime() ||
      JSON.stringify(formik.values.attendees.sort()) !== JSON.stringify(initialAttendees.sort()) ||
      formik.values.heldOn !== initialHeldOnValues.heldOn ||
      formik.values.otherHeldOn !== initialHeldOnValues.otherHeldOn ||
      formik.values.purpose !== initialPurpose ||
      JSON.stringify(formik.values.attachments) !== JSON.stringify(initialAttachments)
    );
  }, [formik.values, mode, initialValues, initialAttendeeIds, initialHeldOnValues]);

  const isLoading = isCreating || isUpdating;

  // Handle delete MOM
  const handleDeleteMOM = async () => {
    if (!initialValues?.id) return;

    try {
      await deleteMOM({ id: initialValues.id }).unwrap();
      toast.success('MOM deleted successfully');
      setIsDeleteModalOpen(false);
      closeSidebar();
    } catch (error: unknown) {
      const err = error as { data?: TErrorResponse };
      if (err?.data?.message) {
        toast.error(err.data.message);
      } else {
        toast.error('Failed to delete MOM');
      }
    }
  };

  // Handle form submission - ensure all fields are touched to show validation errors
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Mark all fields as touched to show validation errors if any
    formik.setTouched({
      title: true,
      startDate: true,
      attendees: true,
      heldOn: true,
      otherHeldOn: true,
      purpose: true,
    });
    setAttendeesTouched(true);

    // Use formik's handleSubmit which will validate and call onSubmit if valid
    // Don't call preventDefault - formik handles it internally
    formik.handleSubmit(e);
  };

  // Reset form when sidebar closes
  useEffect(() => {
    if (!isOpenSidebar) {
      formik.resetForm();
      setAttendeesTouched(false);
    }
  }, [isOpenSidebar]);

  return (
    <DrawerModal opened={isOpenSidebar} onClose={closeSidebar}>
      <div className='h-full flex flex-col'>
        <div className='py-3 px-6 border-b border-gray-200 flex items-center justify-between bg-[#F3F4F7]'>
          <p className='font-semibold'>{mode === 'edit' ? 'Edit MOM' : 'Add New MOM'}</p>
          <button
            onClick={closeSidebar}
            className='p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer'
          >
            <IconX className='size-4 text-text-subHeading' />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleFormSubmit}
          className='space-y-5 p-6 h-full flex flex-col overflow-y-auto'
        >
          {/* Meeting Title */}
          <div className='flex items-start gap-4'>
            <FormLabel className='w-2/5'>Meeting Title</FormLabel>
            <FormInput
              className='w-3/5'
              name='title'
              placeholder='Meeting Title'
              value={formik.values.title}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.title ? (formik.errors.title as string | undefined) : undefined}
            />
          </div>

          {/* Start Date */}
          <div className='flex items-start gap-4'>
            <FormLabel className='w-2/5'>Start Date</FormLabel>
            <FormDate
              className='w-3/5'
              name='startDate'
              placeholder='Select Date'
              value={formik.values.startDate}
              onChange={(val) => formik.setFieldValue('startDate', val)}
              onBlur={() => formik.setFieldTouched('startDate', true)}
              error={
                formik.touched.startDate
                  ? (formik.errors.startDate as string | undefined)
                  : undefined
              }
            />
          </div>

          {/* Attendees */}
          <div className='flex items-start gap-4'>
            <FormLabel className='w-2/5'>Attendees</FormLabel>
            <div className='w-3/5'>
              <SearchableCombobox
                name='attendees'
                placeholder='Select Members'
                value={formik.values.attendees}
                setValue={(val) => {
                  formik.setFieldValue('attendees', val);
                  setAttendeesTouched(true);
                }}
                onSearch={(q) => {
                  if (q.trim()) {
                    triggerSearchUsers({ userName: q });
                  }
                }}
                mapToOptions={mapUsersToOptions}
                initialData={initialUsersData}
                searchedData={searchedUsersData}
                isSearching={isSearchingUsers}
                setTouched={setAttendeesTouched}
                error={
                  attendeesTouched && formik.errors.attendees
                    ? (formik.errors.attendees as string | undefined)
                    : undefined
                }
                defaultData={defaultAttendeeData}
              />
            </div>
          </div>

          {/* Held on */}
          <div className='flex items-start gap-4'>
            <FormLabel className='w-2/5'>Held on</FormLabel>
            <FormSelect
              className='w-3/5'
              name='heldOn'
              placeholder='Select Platform'
              options={HELD_ON_OPTIONS}
              value={formik.values.heldOn}
              onChange={(val) => {
                formik.setFieldValue('heldOn', val);
                // Clear otherHeldOn when switching away from Other
                if (val !== HeldOn.OTHER) {
                  formik.setFieldValue('otherHeldOn', '');
                }
              }}
              error={
                formik.touched.heldOn ? (formik.errors.heldOn as string | undefined) : undefined
              }
              renderOption={({ option }: { option: ComboboxItem | ComboboxItemGroup }) => {
                const optionData = HELD_ON_OPTIONS.find(
                  (o) => o.value === (option as ComboboxItem).value,
                );
                return (
                  <div className='flex items-center gap-2'>
                    {optionData?.icon && (
                      <Image
                        src={optionData.icon}
                        alt={(option as ComboboxItem).label}
                        width={18}
                        height={18}
                      />
                    )}
                    <span>{(option as ComboboxItem).label}</span>
                  </div>
                );
              }}
            />
          </div>

          {/* Other Held On - Show only when "Other" is selected */}
          {formik.values.heldOn === HeldOn.OTHER && (
            <div className='flex items-start gap-4'>
              <FormLabel className='w-2/5'>Specify Platform</FormLabel>
              <FormInput
                className='w-3/5'
                name='otherHeldOn'
                placeholder='Enter platform name'
                value={formik.values.otherHeldOn}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.otherHeldOn
                    ? (formik.errors.otherHeldOn as string | undefined)
                    : undefined
                }
              />
            </div>
          )}

          {/* Meeting Purpose */}
          <div className='flex flex-col gap-2'>
            <FormLabel>Meeting Purpose</FormLabel>
            <MeetingPurposeEditor
              value={formik.values.purpose}
              setValue={(val) => formik.setFieldValue('purpose', val)}
              placeholder='Add Meeting Purpose'
            />
            {formik.touched.purpose && formik.errors.purpose && (
              <p className='text-red-500 text-sm mt-1'>{formik.errors.purpose as string}</p>
            )}
          </div>

          {/* Attachments */}
          <div className='flex flex-col gap-4'>
            <FormAttachment
              currentAttachments={formik.values.attachments as TAttachment[]}
              onUpload={(attachments) => {
                // Preserve all fields from upload API response
                const momAttachments = attachments.map((att) =>
                  convertAttachmentToMOMAttachment(att as any),
                );
                formik.setFieldValue('attachments', momAttachments);
              }}
              folderName='estate-task-attachments'
              label='Attachment'
              multiple={true}
              inputId='mom-attachment'
              addButtonText='Add'
            />
          </div>

          {/* Actions */}
          <div className='flex justify-between items-center gap-3 mt-auto'>
            {mode === 'edit' && (
              <Button
                radius='full'
                type='button'
                onClick={() => setIsDeleteModalOpen(true)}
                className='px-7 bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600'
                disabled={isLoading || isDeleting}
              >
                Delete
              </Button>
            )}
            <Button
              radius='full'
              type='submit'
              className='px-7 ml-auto'
              disabled={isLoading || (mode === 'edit' && !isDirty)}
            >
              {isLoading ? 'Saving...' : 'Save MOM'}
            </Button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      <AlertModal
        opened={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteMOM}
        isLoading={isDeleting}
        title='Delete MOM'
        subtitle={`Are you sure you want to delete "${initialValues?.title || 'this MOM'}"? This action can't be undone.`}
      />
    </DrawerModal>
  );
}
