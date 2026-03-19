'use client';

import { Formik, Form } from 'formik';
import { Button } from '..';
import FormInput from '../base/FormInput';
import FormTextArea from '../base/FormTextArea';
import FormAttachment from '../base/FormAttachment';
import type { TFormProps } from '../../types/common.types';
import {
  createProductSubCategorySchema,
  type TCreateProductSubCategoryFormData,
} from '../../validators/productSubCategory.validator';
import ProductCategorySelector from '../common/selectors/ProductCategorySelector';
import ProductBrandSelector from '../common/selectors/ProductBrandSelector';
import { getButtonText } from '../../utils/helper';

export default function ProductSubCategoryForm({
  initialValues,
  onSubmit,
  disabled,
  mode,
}: TFormProps<TCreateProductSubCategoryFormData>) {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={createProductSubCategorySchema}
      onSubmit={(data, { resetForm }) => onSubmit({ data, resetForm })}
    >
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
        <Form className='px-6 pt-3 pb-3 space-y-3 flex flex-col border'>
          {/* Header */}

          {/* Sub-Category Name */}
          {/* <FormRow label='Sub-Category Name *'> */}
          <FormInput
            label='Sub-Category Name *'
            name='name'
            placeholder='Sub-Category Name'
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.name ? errors.name : undefined}
          />
          {/* </FormRow> */}

          {/* Select Categories & Brands */}
          <div className='grid grid-cols-2 gap-4'>
            {/* <FormRow label='Select Categories *'> */}
            <ProductCategorySelector
              // defaultSearchValue={}
              name='categoryId'
              label='Category*'
              // data={values.categoryOptions || []}
              value={values.categoryId}
              setValue={(val) => setFieldValue('categoryId', val)}
              error={touched.categoryId ? errors.categoryId : undefined}
            />
            {/* </FormRow> */}

            {/* <FormRow label='Select Brands'> */}
            <ProductBrandSelector
              label='Select Brands'
              name='brandId'
              // data={values.brandOptions || []}
              value={values.brandId || ''}
              setValue={(val) => setFieldValue('brandId', val)}
              error={touched.brandId ? errors.brandId : undefined}
            />
            {/* </FormRow> */}
          </div>

          {/* Description */}
          {/* <FormRow label='Sub-Category Description'> */}
          <FormTextArea
            label='Sub-Category Description'
            name='description'
            placeholder='Sub-Category Description'
            value={values.description || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.description ? errors.description : undefined}
          />
          {/* </FormRow> */}
          {/* Upload Icon */}
          <FormAttachment
            inputId='subCategoryAttachments'
            folderName='sub-category-attachments'
            currentAttachments={values.media}
            onUpload={(attachments) => setFieldValue('media', attachments)}
            multiple={false}
            label='Upload Sub-Category Icon'
            addButtonText='Add Icon'
          />
          {errors.media && touched.media && (
            <p className='text-red-500 text-sm -mt-2'>{errors.media as string}</p>
          )}
          {/* Submit Button */}
          <Button radius='full' type='submit' className='mt-auto ml-auto'>
            {getButtonText('', disabled, mode)}
          </Button>
        </Form>
      )}
    </Formik>
  );
}
