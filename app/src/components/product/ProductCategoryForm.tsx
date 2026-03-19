'use client';

// import FormRow from '../base/FormRow';
import { Formik, Form } from 'formik';
import { Button } from '..';
import FormTextArea from '../base/FormTextArea';
import FormInput from '../base/FormInput';
import FormAttachment from '../base/FormAttachment';
import type { TFormProps } from '../../types/common.types';
import {
  createProductCategorySchema,
  type TCreateProductCategoryFormData,
} from '../../validators/productCategory.validator';
import { getButtonText } from '../../utils/helper';

export default function ProductCategoryForm({
  initialValues,
  onSubmit,
  disabled,
  mode,
}: TFormProps<TCreateProductCategoryFormData>) {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={createProductCategorySchema}
      onSubmit={(data, { resetForm }) => onSubmit({ data, resetForm })}
    >
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
        <Form className='px-6 pt-6 pb-3 space-y-6 flex flex-col border'>
          <div className='flex gap-5'>
            {/* Category Name */}
            <FormInput
              label='Category Name *'
              name='name'
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.name ? errors.name : undefined}
              placeholder='Enter category name'
              className='w-100'
            />
            {/* Category Description */}
          </div>
          <FormTextArea
            label='Category Description'
            name='description'
            value={values.description as string}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.description ? errors.description : undefined}
            placeholder='Enter description (optional)'
            className='w-full'
          />
          {/* ATTACHMENT */}
          <FormAttachment
            inputId='productCategoryAttachments'
            folderName='product-category-attachments'
            currentAttachments={values.attachments || []}
            onUpload={(attachments) => setFieldValue('attachments', attachments)}
            label='Attachment'
            labelWrapperClassName='flex-col items-start'
            className='mt-auto flex-row gap-10'
            multiple={false}
          />
          {/* Submit */}
          <Button disabled={disabled} radius='full' type='submit' className='mt-auto ml-auto'>
            {getButtonText('Category', disabled, mode)}
          </Button>
        </Form>
      )}
    </Formik>
  );
}
