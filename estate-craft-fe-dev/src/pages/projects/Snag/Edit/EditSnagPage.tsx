import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetProjectSnagsQuery,
  useUpdateProjectSnagMutation,
} from '../../../../store/services/snag/snagSlice';
import { toast } from 'react-toastify';
import Container from '../../../../components/common/Container';
import BackButton from '../../../../components/base/button/BackButton';
import type { TErrorResponse } from '../../../../store/types/common.types';
import type { TCreateSnagFormData } from '../../../../validators/snag';
import { PageLoader } from '../../../../components';
import { Formik, Form, Field } from 'formik';
import { createSnagSchema } from '../../../../validators/snag';
import FormInput from '../../../../components/base/FormInput';
import FormSelect from '../../../../components/base/FormSelect';
import { Button } from '../../../../components';
import FormTextArea from '../../../../components/base/FormTextArea';
import FormAttachment from '../../../../components/base/FormAttachment';
import type { TAttachment } from '../../../../store/types/common.types';
import { useState } from 'react';
import ColoredBadge from '../../../../components/common/ColoredBadge';
import VendorSelector from '../../../../components/common/selectors/VendorSelector';

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

export default function EditSnagPage() {
  const { snagId, id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading: isLoadingSnag } = useGetProjectSnagsQuery({ id: snagId });
  const [updateSnag, { isLoading: isUpdating }] = useUpdateProjectSnagMutation();
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const snag = data?.snags?.at(0);

  function handleSubmit(values: TCreateSnagFormData) {
    if (!snagId) {
      toast.error('Snag ID is missing');
      return;
    }

    // Remove snagStatus if it's empty
    const submitData = { ...values };
    if (!submitData.snagStatus) {
      delete submitData.snagStatus;
    }

    updateSnag({ id: snagId, ...submitData })
      .unwrap()
      .then(() => {
        toast.success('Snag updated successfully');
        navigate(`/projects/${id}/snag`);
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error('Unable to update snag');
        }
        console.log('Error in updating snag:', error);
      });
  }

  if (isLoadingSnag) {
    return (
      <Container className='relative px-0 py-0 overflow-y-auto border max-h-[calc(100vh-11rem)]'>
        <PageLoader />
      </Container>
    );
  }

  if (!snag) {
    return (
      <Container className='relative px-0 py-0 overflow-y-auto border max-h-[calc(100vh-11rem)]'>
        <BackButton className='px-5 pt-5' backTo={`/projects/${id}/snag`}>
          SNAG
        </BackButton>
        <div className='p-5'>
          <p className='text-red-500'>Snag not found</p>
        </div>
      </Container>
    );
  }

  const initialValues: TCreateSnagFormData = {
    title: snag.title || '',
    description: snag.description || '',
    location: snag.location || '',
    snagCategory: snag.snagCategory || '',
    snagSubCategory: snag.snagSubCategory || '',
    snagStatus: snag.snagStatus || 'PENDING',
    attachments: snag.attachments || [],
    projectId: snag.projectId || id || '',
    vendorId: snag.vendorId || null,
  };

  return (
    <Container className=''>
      <BackButton backTo={`/projects/${id}/snag`}>SNAG</BackButton>

      <div className='mt-3 py-3 flex flex-wrap gap-2 border-y border-gray-200'>
        <ColoredBadge className='bg-blue-100 text-blue-500 ' label='Edit Snag' />
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={createSnagSchema}
        onSubmit={(values) => handleSubmit(values)}
        enableReinitialize
      >
        {({ values, errors, touched, setFieldValue, setFieldTouched }) => (
          <Form className='flex flex-col gap-5 mt-5'>
            {/* LEFT SECTION */}
            <div className='flex md:flex-row flex-col gap-5 '>
              {/* UPLOAD IMAGES SECTION */}
              <section className='md:flex-1'>
                <FormAttachment
                  inputId='snag-images'
                  folderName='estate'
                  currentAttachments={values.attachments as TAttachment[]}
                  onUpload={(files) => setFieldValue('attachments', files)}
                  label='Snag Images'
                  className='h-full'
                  labelWrapperClassName='mb-3'
                />
                {errors.attachments && touched.attachments && (
                  <p className='text-red-500 text-sm mt-2'>{String(errors.attachments)}</p>
                )}
              </section>

              {/* RIGHT SECTION */}
              <section className='md:flex-1 flex-col flex gap-3'>
                <div>
                  <Field name='title'>
                    {({ field }: any) => (
                      <FormInput
                        {...field}
                        label='Snag title'
                        placeholder='Enter snag title'
                        value={field.value}
                      />
                    )}
                  </Field>
                  {errors.title && touched.title && (
                    <p className='text-red-500 text-sm mt-1'>{errors.title}</p>
                  )}
                </div>

                <div>
                  <Field name='description'>
                    {({ field }: any) => (
                      <FormTextArea
                        {...field}
                        placeholder='Enter Description'
                        rows={6}
                        label='Description'
                      />
                    )}
                  </Field>
                  {errors.description && touched.description && (
                    <p className='text-red-500 text-sm mt-1'>{errors.description}</p>
                  )}
                </div>

                <div>
                  <Field name='location'>
                    {({ field }: any) => (
                      <FormInput
                        {...field}
                        required={true}
                        label='Location'
                        placeholder='Enter snag location'
                        value={field.value}
                      />
                    )}
                  </Field>
                  {errors.location && touched.location && (
                    <p className='text-red-500 text-sm mt-1'>{errors.location}</p>
                  )}
                </div>

                <div>
                  <Field name='snagCategory'>
                    {({ field }: any) => (
                      <FormSelect
                        {...field}
                        value={field.value}
                        options={snagCategoryOptions}
                        onChange={(value) => {
                          setFieldValue('snagCategory', value);
                          setSelectedCategory(value || '');
                          // Reset subcategory when category changes
                          setFieldValue('snagSubCategory', '', false);
                          setFieldTouched('snagSubCategory', false, false);
                        }}
                        required={true}
                        label='Snag Category'
                        placeholder='Select Snag Category'
                      />
                    )}
                  </Field>
                  {errors.snagCategory && touched.snagCategory && (
                    <p className='text-red-500 text-sm mt-1'>{errors.snagCategory}</p>
                  )}
                </div>

                <div>
                  <Field name='snagSubCategory'>
                    {({ field }: any) => (
                      <FormSelect
                        {...field}
                        value={field.value}
                        options={
                          selectedCategory || values.snagCategory
                            ? snagSubCategoryOptions[selectedCategory || values.snagCategory] || []
                            : []
                        }
                        onChange={(value) => setFieldValue('snagSubCategory', value)}
                        required={true}
                        label='Sub Snag Category'
                        placeholder='Select Sub Snag Category'
                        disabled={!selectedCategory && !values.snagCategory}
                      />
                    )}
                  </Field>
                  {errors.snagSubCategory && touched.snagSubCategory && (
                    <p className='text-red-500 text-sm mt-1'>{errors.snagSubCategory}</p>
                  )}
                </div>

                <div>
                  <Field name='snagStatus'>
                    {({ field }: any) => (
                      <FormSelect
                        {...field}
                        value={field.value}
                        options={snagStatusOptions}
                        onChange={(value) => setFieldValue('snagStatus', value)}
                        required={false}
                        label='Status'
                        placeholder='Select Status (Optional)'
                      />
                    )}
                  </Field>
                  {errors.snagStatus && touched.snagStatus && (
                    <p className='text-red-500 text-sm mt-1'>{errors.snagStatus}</p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Vendor</label>
                  <VendorSelector
                    value={values.vendorId || null}
                    setValue={(val) => setFieldValue('vendorId', val || null)}
                    error={touched.vendorId ? errors.vendorId : undefined}
                  />
                </div>
              </section>
            </div>

            {/* BOTTOM SECTION */}
            <section className='mt-auto flex md:flex-row flex-col gap-5 md:justify-end'>
              <div className='flex gap-3'>
                <Button
                  className='bg-white'
                  type='button'
                  variant='outline'
                  radius='full'
                  onClick={() => navigate(`/projects/${id}/snag`)}
                >
                  Cancel
                </Button>
                <Button radius='full' type='submit' disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update Snag'}
                </Button>
              </div>
            </section>
          </Form>
        )}
      </Formik>
    </Container>
  );
}
