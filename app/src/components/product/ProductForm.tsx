import { Formik, Form } from 'formik';
import { Button } from '..';
import FormRow from '../base/FormRow';
import FormSelect from '../base/FormSelect';
import FormTextArea from '../base/FormTextArea';
import FormInput from '../base/FormInput';
// import FileUpload from '../../components/base/FileUpload';
import {
  createProductSchema,
  type TCreateProductFormData,
} from '../../validators/product.validator';
import type { TFormProps } from '../../types/common.types';
import VendorSelector from '../common/selectors/VendorSelector';
import FormAttachment from '../base/FormAttachment';
import ProductCategorySelector from '../common/selectors/ProductCategorySelector';
import ProductSubCategorySelector from '../common/selectors/ProductSubCategorySelector';
import UnitSelector from '../common/selectors/UnitSelector';
import { CURRENCIES } from '../../constants/project';
import { getButtonText, numberToWords } from '../../utils/helper';
// import AddProductSubCategoryModal from './AddProductSubCategoryModal';
// import AddProductCategoryModal from './AddProductCategoryModal';

export default function ProductForm({
  initialValues,
  onSubmit,
  disabled,
  mode,
  defaultCategoryName,
  // defaultVendorName,
}: TFormProps<TCreateProductFormData> & {
  defaultCategoryName?: string;
  defaultVendorName?: string;
}) {
  return (
    <>
      <Formik
        initialValues={initialValues}
        validationSchema={createProductSchema}
        onSubmit={(data, { resetForm }) => onSubmit({ data, resetForm })}
      >
        {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
          <Form className=' flex flex-col '>
            <div className='px-6 pt-6 pb-10 space-y-6'>
              {/* Product Name */}
              <FormRow label='Product Name *'>
                <FormInput
                  disabled={disabled}
                  name='name'
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.name ? errors.name : undefined}
                  placeholder='Enter product name'
                />
              </FormRow>
              <FormRow label='Description'>
                <FormTextArea
                  disabled={disabled}
                  name='description'
                  value={values.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.description ? errors.description : undefined}
                  className='w-full'
                />
              </FormRow>
              {/* Category Row */}
              <FormRow label='Category'>
                <ProductCategorySelector
                  defaultSearchValue={defaultCategoryName}
                  disabled={disabled}
                  value={values.categoryId || null}
                  setValue={(val) => {
                    setFieldValue('categoryId', val);
                    // Reset sub-category when category changes
                    if (val !== values.categoryId) {
                      setFieldValue('subCategoryId', null);
                    }
                  }}
                  error={touched.categoryId ? errors.categoryId : undefined}
                  className='w-full'
                />
              </FormRow>
              <FormRow label='Sub-Category'>
                <ProductSubCategorySelector
                  categoryId={values.categoryId}
                  disabled={disabled || !values.categoryId}
                  value={values.subCategoryId || null}
                  setValue={(val) => setFieldValue('subCategoryId', val)}
                  error={touched.subCategoryId ? errors.subCategoryId : undefined}
                  className='w-full'
                />
              </FormRow>
              <FormRow label='Vendor'>
                <VendorSelector
                  // defaultSearchValue={defaultVendorName}
                  disabled={disabled}
                  value={values.vendorId || null}
                  setValue={(val) => setFieldValue('vendorId', val)}
                  error={touched.vendorId ? errors.vendorId : undefined}
                />
              </FormRow>

              {/* Codes and Currency */}
              <div className='grid grid-cols-2 gap-6'>
                <FormInput
                  disabled={disabled}
                  name='materialCode'
                  label='Material Code'
                  value={values.materialCode as string}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.materialCode ? errors.materialCode : undefined}
                />{' '}
                <FormInput
                  disabled={disabled}
                  name='colorCode'
                  label='Color Code'
                  value={values.colorCode || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.colorCode ? errors.colorCode : undefined}
                />
                <UnitSelector
                  disabled={disabled}
                  value={values.unitId || null}
                  setValue={(val) => setFieldValue('unitId', val)}
                  error={touched.unitId ? errors.unitId : undefined}
                />
                <FormSelect
                  disabled={disabled}
                  options={CURRENCIES}
                  name='currency'
                  placeholder='Enter currency'
                  label='Currency*'
                  value={values.currency}
                  onChange={(val) => setFieldValue('currency', val)}
                  onBlur={handleBlur}
                  error={touched.currency ? errors.currency : undefined}
                />
                <div className='flex flex-col gap-1 w-full col-span-2'>
                  <FormInput
                    disabled={disabled}
                    name='mrp'
                    type='text'
                    label='M.R.P*'
                    value={values.mrp ? values.mrp.toLocaleString('en-IN') : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, '');
                      if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                        const numericValue = raw === '' ? 0 : parseFloat(raw) || 0;
                        setFieldValue('mrp', numericValue);
                      }
                    }}
                    onBlur={handleBlur}
                    error={touched.mrp ? errors.mrp : undefined}
                  />
                  {values.mrp && values.mrp > 0 ? (
                    <div className='mt-1'>
                      <span className='text-xs text-gray-600 italic'>
                        {numberToWords(values.mrp)} Rupees Only
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
              <FormAttachment
                disabled={disabled}
                inputId='materialAttachment'
                //TODO:update folderName and other things
                folderName='estatecraft-product-attachments'
                currentAttachments={values.materialFile}
                onUpload={(attachments) => setFieldValue('materialFile', attachments)}
                label='Material Image'
                multiple={false}
              />
              <FormSeparator />
              <FormAttachment
                disabled={disabled}
                inputId='primaryAttachment'
                //TODO:update folderName and other things
                folderName='estatecraft-product-attachments'
                currentAttachments={values.primaryFile}
                onUpload={(attachments) => setFieldValue('primaryFile', attachments)}
                label='Primary Image'
                multiple={false}
                className=''
              />
              <FormSeparator />
              <FormAttachment
                disabled={disabled}
                inputId='secondaryAttachment'
                folderName='estatecraft-product-attachments'
                currentAttachments={values.secondaryFile}
                onUpload={(attachments) => setFieldValue('secondaryFile', attachments)}
                label='Secondary Image'
              />
            </div>
            {/* Submit Button */}
            <div className='flex w-full  sticky bottom-0 bg-bg-light p-3'>
              <Button radius='full' type='submit' disabled={disabled} className='mt-auto ml-auto'>
                {getButtonText('Product', disabled, mode)}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
      {/* <AddProductCategoryModal opened /> */}
      {/* <AddProductSubCategoryModal opened /> */}
    </>
  );
}

function FormSeparator() {
  return <hr className='w-full border-[1.5px] mt-6 mb-6' />;
}

{
  /* <div className='flex gap-6'>
              <FormInputNumber
                name='currencyConversionFactor'
                label='Currency Conversion Factor'
                value={values.currencyConversionFactor as number}
                onChange={handleChange}
                onBlur={handleBlur}
                error={
                  touched.currencyConversionFactor ? errors.currencyConversionFactor : undefined
                }
                className='w-full'
              />
              <FormInputNumber
                name='costFactor'
                label='Cost Factor'
                value={values.costFactor as number}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.costFactor ? errors.costFactor : undefined}
                className='w-full'
              />
            </div> */
}
{
  /* Tags */
}
{
  /* <FormRow label='Tags'>
            <FormInput
              name='tags'
              value={values.tags}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.tags ? errors.tags : undefined}
              placeholder='Enter tags (comma separated)'
            />
          </FormRow> */
}
{
  /* 

              <FormInputNumber
                name='costPrice'
                label='Cost Price'
                value={values.costPrice as number}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.costPrice ? errors.costPrice : undefined}
              /> */
}
