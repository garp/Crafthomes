'use client';

import { Formik, Form } from 'formik';
import { Button } from '..';
import FormInput from '../base/FormInput';
import type { TFormProps } from '../../types/common.types';
import {
  createProductBrandSchema,
  type TCreateProductBrandFormData,
} from '../../validators/productBrand.validator';
import { getButtonText } from '../../utils/helper';

export default function ProductBrandForm({
  initialValues,
  onSubmit,
  disabled,
  mode,
}: TFormProps<TCreateProductBrandFormData>) {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={createProductBrandSchema}
      onSubmit={(data, { resetForm }) => onSubmit({ data, resetForm })}
    >
      {({ values, errors, touched, handleChange, handleBlur }) => (
        <Form className='px-6 pt-6 pb-3 space-y-6 flex flex-col border'>
          <FormInput
            label='Brand Name *'
            name='name'
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.name ? errors.name : undefined}
            placeholder='Enter brand name'
            className='w-full'
          />
          <Button disabled={disabled} radius='full' type='submit' className='mt-auto ml-auto'>
            {getButtonText('Brand', disabled, mode)}
          </Button>
        </Form>
      )}
    </Formik>
  );
}
