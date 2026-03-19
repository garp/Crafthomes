import { useFormik } from 'formik';
import { useEffect, useMemo, useState } from 'react';
import { IconX } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import type { TSidebarProps } from '../../../../types/common.types';
import type { TAttachment, TErrorResponse } from '../../../../store/types/common.types';
import type { TSnag } from '../../../../store/types/snag.types';

import DrawerModal from '../../../../components/base/DrawerModal';
import FormInput from '../../../../components/base/FormInput';
import FormSelect from '../../../../components/base/FormSelect';
import FormAttachment from '../../../../components/base/FormAttachment';
import RichTextEditorDescription from '../../../../components/common/RichTextEditorDescription';
import { Button } from '../../../../components';
import FormLabel from '../../../../components/base/FormLabel';
import { createSnagSchema } from '../../../../validators/snag';
import VendorSelector from '../../../../components/common/selectors/VendorSelector';
import {
  useCreateProjectSnagMutation,
  useUpdateProjectSnagMutation,
  useDeleteProjectSnagMutation,
} from '../../../../store/services/snag/snagSlice';
import AlertModal from '../../../../components/base/AlertModal';

// Snag status options
const snagStatusOptions = [
  { label: 'Temporary', value: 'TEMPORARY' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Open', value: 'OPEN' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Closed', value: 'CLOSED' },
];

// Snag category options
const snagCategoryOptions = [
  { label: 'Windows & Glass', value: 'Windows & Glass' },
  { label: 'Walls & Ceiling', value: 'Walls & Ceiling' },
  { label: 'Flooring', value: 'Flooring' },
  { label: 'Plumbing', value: 'Plumbing' },
  { label: 'Electrical', value: 'Electrical' },
  { label: 'Other', value: 'Other' },
];

// Sub-category options mapping
const snagSubCategoryOptions: Record<string, { label: string; value: string }[]> = {
  'Windows & Glass': [
    { label: 'Glass Breakage', value: 'Glass Breakage' },
    { label: 'Frame Issues', value: 'Frame Issues' },
    { label: 'Seal Problems', value: 'Seal Problems' },
  ],
  'Walls & Ceiling': [
    { label: 'Cracks', value: 'Cracks' },
    { label: 'Paint Issues', value: 'Paint Issues' },
    { label: 'Water Damage', value: 'Water Damage' },
  ],
  Flooring: [
    { label: 'Tiles Broken', value: 'Tiles Broken' },
    { label: 'Uneven Surface', value: 'Uneven Surface' },
    { label: 'Scratches', value: 'Scratches' },
  ],
  Plumbing: [
    { label: 'Leaks', value: 'Leaks' },
    { label: 'Blockage', value: 'Blockage' },
    { label: 'Fixture Issues', value: 'Fixture Issues' },
  ],
  Electrical: [
    { label: 'Wiring Issues', value: 'Wiring Issues' },
    { label: 'Switch Problems', value: 'Switch Problems' },
    { label: 'Light Fixtures', value: 'Light Fixtures' },
  ],
  Other: [{ label: 'Other', value: 'Other' }],
};

interface CreateSnagSidebarProps extends TSidebarProps {
  mode?: 'create' | 'edit';
  initialValues?: Partial<TSnag>;
  projectId: string;
}

export default function CreateSnagSidebar({
  isOpen,
  onClose,
  mode = 'create',
  initialValues,
  projectId,
}: CreateSnagSidebarProps) {
  const [createSnag, { isLoading: isCreating }] = useCreateProjectSnagMutation();
  const [updateSnag, { isLoading: isUpdating }] = useUpdateProjectSnagMutation();
  const [deleteSnag, { isLoading: isDeleting }] = useDeleteProjectSnagMutation();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [customCategory, setCustomCategory] = useState<string>('');
  const [isCustomSubCategory, setIsCustomSubCategory] = useState<boolean>(false);
  const [customSubCategory, setCustomSubCategory] = useState<string>('');

  // Set initial values for edit mode
  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      setSelectedCategory(initialValues.snagCategory || '');
      setIsCustomCategory(initialValues.snagCategory === 'Other');
      setCustomCategory(initialValues.otherCategory || '');
      setIsCustomSubCategory(initialValues.snagSubCategory === 'Other');
      setCustomSubCategory(initialValues.otherSubCategory || '');
    }
  }, [mode, initialValues]);

  const formik = useFormik({
    initialValues: {
      title: initialValues?.title || '',
      description: initialValues?.description || '',
      location: initialValues?.location || '',
      snagCategory: initialValues?.snagCategory || '',
      snagSubCategory: initialValues?.snagSubCategory || '',
      otherCategory: initialValues?.otherCategory || '',
      otherSubCategory: initialValues?.otherSubCategory || '',
      snagStatus: initialValues?.snagStatus || 'PENDING',
      attachments: initialValues?.attachments || [],
      projectId: projectId,
      vendorId: initialValues?.vendorId || null,
    },
    validationSchema: createSnagSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      // Remove snagStatus if it's empty
      const submitData = { ...values };
      if (!submitData.snagStatus) {
        delete (submitData as any).snagStatus;
      }

      try {
        if (mode === 'edit' && initialValues?.id) {
          await updateSnag({ id: initialValues.id, ...submitData }).unwrap();
          toast.success('Snag updated successfully');
        } else {
          await createSnag(submitData).unwrap();
          toast.success('Snag created successfully');
        }
        onClose();
        formik.resetForm();
        resetCustomFields();
        setSubmitting(false);
      } catch (error: unknown) {
        const err = error as { data?: TErrorResponse };
        if (err?.data?.message) {
          toast.error(err.data.message);
        } else {
          toast.error(mode === 'edit' ? 'Failed to update snag' : 'Failed to create snag');
        }
        setSubmitting(false);
      }
    },
  });

  const resetCustomFields = () => {
    setSelectedCategory('');
    setIsCustomCategory(false);
    setCustomCategory('');
    setIsCustomSubCategory(false);
    setCustomSubCategory('');
  };

  // Track dirty state
  const isDirty = useMemo(() => {
    if (mode === 'create') {
      return (
        formik.values.title !== '' ||
        formik.values.description !== '' ||
        formik.values.location !== '' ||
        formik.values.snagCategory !== '' ||
        formik.values.snagSubCategory !== '' ||
        formik.values.vendorId !== null ||
        formik.values.attachments.length > 0
      );
    }

    // Edit mode - compare with initial values
    const initialTitle = initialValues?.title || '';
    const initialDescription = initialValues?.description || '';
    const initialLocation = initialValues?.location || '';
    const initialSnagCategory = initialValues?.snagCategory || '';
    const initialSnagSubCategory = initialValues?.snagSubCategory || '';
    const initialOtherCategory = initialValues?.otherCategory || '';
    const initialOtherSubCategory = initialValues?.otherSubCategory || '';
    const initialSnagStatus = initialValues?.snagStatus || 'PENDING';
    const initialAttachments = initialValues?.attachments || [];
    const initialVendorId = initialValues?.vendorId || null;

    return (
      formik.values.title !== initialTitle ||
      formik.values.description !== initialDescription ||
      formik.values.location !== initialLocation ||
      formik.values.snagCategory !== initialSnagCategory ||
      formik.values.snagSubCategory !== initialSnagSubCategory ||
      formik.values.otherCategory !== initialOtherCategory ||
      formik.values.otherSubCategory !== initialOtherSubCategory ||
      formik.values.snagStatus !== initialSnagStatus ||
      formik.values.vendorId !== initialVendorId ||
      JSON.stringify(formik.values.attachments) !== JSON.stringify(initialAttachments)
    );
  }, [formik.values, mode, initialValues]);

  const isLoading = isCreating || isUpdating;

  // Handle delete snag
  const handleDeleteSnag = async () => {
    if (!initialValues?.id) return;

    try {
      await deleteSnag(initialValues.id).unwrap();
      toast.success('Snag deleted successfully');
      setIsDeleteModalOpen(false);
      onClose();
    } catch (error: unknown) {
      const err = error as { data?: TErrorResponse };
      if (err?.data?.message) {
        toast.error(err.data.message);
      } else {
        toast.error('Failed to delete snag');
      }
    }
  };

  // Handle form submission - ensure all fields are touched to show validation errors
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Mark all fields as touched to show validation errors if any
    formik.setTouched({
      title: true,
      description: true,
      location: true,
      snagCategory: true,
      snagSubCategory: true,
      otherCategory: true,
      otherSubCategory: true,
      snagStatus: true,
      vendorId: true,
    });

    // Use formik's handleSubmit which will validate and call onSubmit if valid
    formik.handleSubmit(e);
  };

  // Reset form when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      formik.resetForm();
      resetCustomFields();
    }
  }, [isOpen]);

  return (
    <DrawerModal opened={isOpen} onClose={onClose}>
      <div className='h-full flex flex-col'>
        <div className='py-3 px-6 border-b border-gray-200 flex items-center justify-between bg-[#F3F4F7]'>
          <p className='font-semibold'>{mode === 'edit' ? 'Edit Snag' : 'Add New Snag'}</p>
          <button
            onClick={onClose}
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
          {/* Snag Title */}
          <div className='flex items-start gap-4'>
            <FormLabel className='w-2/5'>Snag Title</FormLabel>
            <FormInput
              className='w-3/5'
              name='title'
              placeholder='Enter snag title'
              value={formik.values.title}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.title ? (formik.errors.title as string | undefined) : undefined}
            />
          </div>

          {/* Description */}
          <div className='flex flex-col gap-2'>
            <FormLabel>Description</FormLabel>
            <RichTextEditorDescription
              value={formik.values.description}
              setValue={(value) => formik.setFieldValue('description', value)}
              placeholder='Enter description'
              imageFolder='estate'
            />
            {formik.touched.description && formik.errors.description && (
              <p className='text-red-500 text-sm mt-1'>{formik.errors.description as string}</p>
            )}
          </div>

          {/* Location */}
          <div className='flex items-start gap-4'>
            <FormLabel className='w-2/5'>Location</FormLabel>
            <FormInput
              className='w-3/5'
              name='location'
              placeholder='Enter snag location'
              value={formik.values.location}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.location ? (formik.errors.location as string | undefined) : undefined
              }
            />
          </div>

          {/* Snag Category */}
          <div className='flex items-start gap-4'>
            <FormLabel className='w-2/5'>Snag Category</FormLabel>
            <div className='w-3/5'>
              <FormSelect
                name='snagCategory'
                placeholder='Select Snag Category'
                options={snagCategoryOptions}
                value={formik.values.snagCategory}
                onChange={(value) => {
                  const selectedValue = value || '';
                  setSelectedCategory(selectedValue);
                  setIsCustomCategory(selectedValue === 'Other');

                  if (selectedValue === 'Other') {
                    formik.setFieldValue('snagCategory', 'Other');
                    formik.setFieldValue('otherCategory', customCategory);
                  } else {
                    formik.setFieldValue('snagCategory', selectedValue);
                    formik.setFieldValue('otherCategory', '');
                    setCustomCategory('');
                  }

                  // Reset subcategory when category changes
                  formik.setFieldValue('snagSubCategory', '', false);
                  formik.setFieldValue('otherSubCategory', '');
                  setIsCustomSubCategory(false);
                  setCustomSubCategory('');
                }}
                error={
                  formik.touched.snagCategory
                    ? (formik.errors.snagCategory as string | undefined)
                    : undefined
                }
              />

              {/* Custom Category Input */}
              {isCustomCategory && (
                <div className='mt-2'>
                  <FormInput
                    label='Custom Category'
                    placeholder='Enter custom category'
                    value={customCategory}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCustomCategory(value);
                      formik.setFieldValue('otherCategory', value);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sub Category */}
          <div className='flex items-start gap-4'>
            <FormLabel className='w-2/5'>Sub Category</FormLabel>
            <div className='w-3/5'>
              <FormSelect
                name='snagSubCategory'
                placeholder='Select Sub Category'
                options={
                  selectedCategory || formik.values.snagCategory
                    ? snagSubCategoryOptions[selectedCategory || formik.values.snagCategory] || []
                    : []
                }
                value={formik.values.snagSubCategory}
                onChange={(value) => {
                  const selectedValue = value || '';
                  setIsCustomSubCategory(selectedValue === 'Other');

                  if (selectedValue === 'Other') {
                    formik.setFieldValue('snagSubCategory', 'Other');
                    formik.setFieldValue('otherSubCategory', customSubCategory);
                  } else {
                    formik.setFieldValue('snagSubCategory', selectedValue);
                    formik.setFieldValue('otherSubCategory', '');
                    setCustomSubCategory('');
                  }
                }}
                disabled={!selectedCategory && !formik.values.snagCategory}
                error={
                  formik.touched.snagSubCategory
                    ? (formik.errors.snagSubCategory as string | undefined)
                    : undefined
                }
              />

              {/* Custom Sub-Category Input */}
              {isCustomSubCategory && (
                <div className='mt-2'>
                  <FormInput
                    label='Custom Sub-Category'
                    placeholder='Enter custom sub-category'
                    value={customSubCategory}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCustomSubCategory(value);
                      formik.setFieldValue('otherSubCategory', value);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className='flex items-start gap-4'>
            <FormLabel className='w-2/5'>Status</FormLabel>
            <FormSelect
              className='w-3/5'
              name='snagStatus'
              placeholder='Select Status'
              options={snagStatusOptions}
              value={formik.values.snagStatus}
              onChange={(val) => formik.setFieldValue('snagStatus', val)}
              error={
                formik.touched.snagStatus
                  ? (formik.errors.snagStatus as string | undefined)
                  : undefined
              }
            />
          </div>

          {/* Vendor */}
          <div className='flex items-start gap-4'>
            <FormLabel className='w-2/5'>Vendor</FormLabel>
            <div className='w-3/5'>
              <VendorSelector
                value={formik.values.vendorId || null}
                setValue={(val) => formik.setFieldValue('vendorId', val || null)}
                error={
                  formik.touched.vendorId
                    ? (formik.errors.vendorId as string | undefined)
                    : undefined
                }
              />
            </div>
          </div>

          {/* Attachments */}
          <div className='flex flex-col gap-4'>
            <FormAttachment
              currentAttachments={formik.values.attachments as TAttachment[]}
              onUpload={(attachments) => {
                formik.setFieldValue('attachments', attachments);
              }}
              folderName='estate'
              label='Snag Images'
              multiple={true}
              inputId='snag-attachment'
              addButtonText='Add Images'
            />
            {formik.touched.attachments && formik.errors.attachments && (
              <p className='text-red-500 text-sm mt-1'>{String(formik.errors.attachments)}</p>
            )}
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
              {isLoading ? 'Saving...' : mode === 'edit' ? 'Update Snag' : 'Create Snag'}
            </Button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      <AlertModal
        opened={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteSnag}
        isLoading={isDeleting}
        title='Delete Snag'
        subtitle={`Are you sure you want to delete "${initialValues?.title || 'this snag'}"? This action can't be undone.`}
      />
    </DrawerModal>
  );
}
