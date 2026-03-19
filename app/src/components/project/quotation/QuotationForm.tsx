import { Formik, Form, Field, type FieldProps, useFormikContext } from 'formik';
import { Button, DeleteButton, Image, PageLoader } from '../..';
import FormLabel from '../../base/FormLabel';
import FormTextArea from '../../base/FormTextArea';
import { IconPhoto, IconPlus } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import type { TCreateProductFormData } from '../../../validators/product.validator';
import {
  createQuotationSchema,
  type TCreateQuotationFormData,
} from '../../../validators/quotation';
// import { motion, AnimatePresence } from 'framer-motion';
import { Fragment, useMemo, useState } from 'react';
import type { TQuotationItemForm } from '../../../store/types/projectQuotation.types';
import type { TQuotationFormProps } from '../../../types/project';
// import IconButton from '../../base/button/IconButton';
import { getButtonText, prefixCurrencyInPrice } from '../../../utils/helper';
import FormInput from '../../base/FormInput';
import FormSelect from '../../base/FormSelect';
import ClientSelector from '../../common/selectors/ClientSelector';
import PolicySelector from '../../common/selectors/PolicySelector';
import ProductCombobox from '../../common/combobox/ProductCombobox';
import TableWrapper from '../../base/table/TableWrapper';
import {
  useGetProductsQuery,
  useLazyGetProductsQuery,
  useCreateProductMutation,
} from '../../../store/services/product/productSlice';
import { useGetClientsQuery } from '../../../store/services/client/clientSlice';
import { useGetUnitsQuery } from '../../../store/services/unit/unitSlice';
import { useGetAreasQuery, useCreateAreaMutation } from '../../../store/services/area/areaSlice';
import { useUploadFilesMutation } from '../../../store/services/upload/upload';
import { MAX_FILE_SIZE } from '../../../constants/common';
import { Badge, Modal, NumberInput, Table, TextInput } from '@mantine/core';
import TableData from '../../base/table/TableData';
import { useEffect, useCallback, useRef } from 'react';
import type { TProduct } from '../../../store/types/product.types';
import type { TClient } from '../../../store/types/client.types';
import AddProductSidebar from '../../product/AddProductSidebar';
import { useDisclosure } from '@mantine/hooks';

function TotalAmountCalculator() {
  const { values, setFieldValue } = useFormikContext<TCreateQuotationFormData>();

  useEffect(() => {
    const calculatedTotalAmount =
      values.items?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
    const roundedTotalAmount = Math.round(calculatedTotalAmount * 100) / 100; // Round to 2 decimal places

    if (Math.abs(roundedTotalAmount - (values.totalAmount || 0)) > 0.01) {
      setFieldValue('totalAmount', Math.max(0, roundedTotalAmount));
    }
  }, [values.items, values.totalAmount, setFieldValue]);

  return null;
}

function ProductCreationHandler({
  newlyCreatedProductId,
  setNewlyCreatedProductId,
  values,
  setFieldValue,
}: {
  newlyCreatedProductId: string | null;
  setNewlyCreatedProductId: (id: string | null) => void;
  values: TCreateQuotationFormData;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
}) {
  useEffect(() => {
    if (newlyCreatedProductId && values.items) {
      const productExists = values.items.some(
        (item) => item.masterItemId === newlyCreatedProductId,
      );
      if (!productExists) {
        const newItems = [
          ...values.items,
          {
            masterItemId: newlyCreatedProductId,
            quantity: 1,
            discount: 0,
            total: 0,
            area: undefined,
            unitId: undefined,
            attachmentId: undefined,
            attachmentUrl: undefined,
            gst: 18,
          },
        ];
        setFieldValue('items', newItems, false);
      }
      setNewlyCreatedProductId(null);
    }
  }, [newlyCreatedProductId, values.items, setFieldValue, setNewlyCreatedProductId]);

  return null;
}

// Helper function to map address to select option
const mapAddressToOption = (
  address: NonNullable<TClient['addresses']>[number],
  index: number,
): { label: string; value: string } => {
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
  return { label, value };
};

export default function QuotationForm({
  initialValues,
  onSubmit,
  isSubmitting,
  mode,
  defaultClientName,
}: TQuotationFormProps) {
  const [isAddProductSidebarOpen, { open: openAddProductSidebar, close: closeAddProductSidebar }] =
    useDisclosure(false);
  const [isAddAreaModalOpen, { open: openAddAreaModal, close: closeAddAreaModal }] =
    useDisclosure(false);
  const [addAreaName, setAddAreaName] = useState('');
  const [createArea, { isLoading: isCreatingArea }] = useCreateAreaMutation();
  const { data: areasData } = useGetAreasQuery({ pageLimit: '100' });
  const areas = areasData?.areas ?? [];
  const [newlyCreatedProductId, setNewlyCreatedProductId] = useState<string | null>(null);

  // Get clients data for addresses
  const { data: clientsData } = useGetClientsQuery({ pageLimit: '1000' });

  if (!initialValues) return <PageLoader />;
  return (
    <Formik<TCreateQuotationFormData>
      initialValues={initialValues}
      validationSchema={createQuotationSchema}
      enableReinitialize
      onSubmit={onSubmit}
    >
      {({ errors, touched, setFieldValue, values, setFieldTouched }) => {
        return (
          <Form className='flex flex-col'>
            <TotalAmountCalculator />
            <ProductCreationHandler
              newlyCreatedProductId={newlyCreatedProductId}
              setNewlyCreatedProductId={setNewlyCreatedProductId}
              values={values}
              setFieldValue={setFieldValue}
            />
            {/* Top Section */}
            <section className='grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-x-5 gap-y-5 px-5 pt-5 pb-5'>
              <div>
                <FormLabel>Quotation Name*</FormLabel>
                <Field name='name'>
                  {({ field }: FieldProps) => (
                    <FormInput
                      {...field}
                      placeholder='Enter quotation name'
                      error={touched.name ? errors.name : undefined}
                    />
                  )}
                </Field>
              </div>

              <div>
                <FormLabel>Client Name*</FormLabel>
                {values.clientId ? (
                  <p className='w-full py-3 px-3 rounded border border-gray-200 bg-gray-50 text-sm font-medium text-gray-900'>
                    {defaultClientName || '—'}
                  </p>
                ) : (
                  <ClientSelector
                    className='w-full'
                    inputClassName='!py-5.5'
                    value={values.clientId}
                    setValue={(val) => {
                      setFieldValue('clientId', val);
                      // Auto-select first address when client changes
                      if (val && clientsData?.clients) {
                        const selectedClient = clientsData.clients.find((c) => c.id === val);
                        if (selectedClient?.addresses && selectedClient.addresses.length > 0) {
                          const firstAddressOption = mapAddressToOption(
                            selectedClient.addresses[0],
                            0,
                          );
                          setFieldValue('addressId', firstAddressOption.value);
                        } else {
                          setFieldValue('addressId', null);
                        }
                      } else {
                        setFieldValue('addressId', null);
                      }
                    }}
                    error={touched.clientId ? errors.clientId : undefined}
                  />
                )}
              </div>

              {/* Client Address Selector */}
              {values.clientId &&
                (() => {
                  const selectedClient = clientsData?.clients?.find(
                    (c) => c.id === values.clientId,
                  );
                  const addressOptions =
                    selectedClient?.addresses?.map((addr, idx) => mapAddressToOption(addr, idx)) ||
                    [];

                  // Auto-select first address if not already selected
                  if (addressOptions.length > 0 && !values.addressId) {
                    setTimeout(() => setFieldValue('addressId', addressOptions[0].value), 0);
                  }

                  return addressOptions.length > 0 ? (
                    <div>
                      <FormLabel>Client Address</FormLabel>
                      <FormSelect
                        name='addressId'
                        placeholder='Select address'
                        value={values.addressId || addressOptions[0]?.value || null}
                        onChange={(val) => setFieldValue('addressId', val)}
                        options={addressOptions}
                        className='w-full'
                        classNames={{
                          input: '!py-5.5 !font-medium',
                        }}
                      />
                    </div>
                  ) : null;
                })()}

              <div>
                <FormLabel>Policy</FormLabel>
                <PolicySelector
                  className='w-full'
                  inputClassName='!py-5.5'
                  value={values.policyId ?? null}
                  setValue={(val) => setFieldValue('policyId', val)}
                  error={touched.policyId ? errors.policyId : undefined}
                />
              </div>

              <div>
                <FormLabel>Discount (%)</FormLabel>
                <NumberInput
                  min={0}
                  max={100}
                  clampBehavior='strict'
                  allowNegative={false}
                  value={values.discount || 0}
                  onChange={(val) => {
                    if (typeof val !== 'number') return;
                    // Strictly block values beyond 100 - immediately clamp
                    const discountPercent = val > 100 ? 100 : val < 0 ? 0 : val;
                    // Only update if the value actually changed (to prevent loops)
                    if (discountPercent !== (values.discount || 0)) {
                      setFieldValue('discount', discountPercent, false);
                    }
                  }}
                  onBlur={() => {
                    // Ensure value is clamped on blur as well
                    const currentValue = values.discount || 0;
                    if (currentValue > 100) {
                      setFieldValue('discount', 100, false);
                    } else if (currentValue < 0) {
                      setFieldValue('discount', 0, false);
                    }
                  }}
                  placeholder='Enter discount percentage (0-100)'
                  className='w-full'
                  classNames={{
                    input: '!py-5.5 !font-medium',
                  }}
                />
              </div>

              <div>
                <FormLabel>Paid Amount</FormLabel>
                <NumberInput
                  min={0}
                  max={values.totalAmount || undefined}
                  clampBehavior='strict'
                  allowNegative={false}
                  value={values.paidAmount || 0}
                  onChange={(val) => {
                    if (typeof val !== 'number') return;
                    const totalAmount = values.totalAmount || 0;
                    // Block negative values and values exceeding total amount
                    const paidAmount = val < 0 ? 0 : val > totalAmount ? totalAmount : val;
                    // Only update if the value actually changed (to prevent loops)
                    if (paidAmount !== (values.paidAmount || 0)) {
                      setFieldValue('paidAmount', paidAmount);
                    }
                  }}
                  onBlur={() => {
                    setFieldTouched('paidAmount', true);
                    // Ensure value is clamped on blur as well
                    const currentValue = values.paidAmount || 0;
                    const totalAmount = values.totalAmount || 0;
                    if (currentValue < 0) {
                      setFieldValue('paidAmount', 0);
                    } else if (currentValue > totalAmount) {
                      setFieldValue('paidAmount', totalAmount);
                    }
                  }}
                  placeholder='Enter paid amount'
                  className='w-full'
                  classNames={{
                    input: '!py-5.5 !font-medium',
                  }}
                  error={touched.paidAmount ? errors.paidAmount : undefined}
                  disabled={!values.items || values.items.length === 0}
                />
                {values.totalAmount > 0 && (
                  <p className='text-xs text-gray-500 mt-1'>
                    Maximum: {prefixCurrencyInPrice(values.totalAmount, 'INR', true)}
                  </p>
                )}
                {(!values.items || values.items.length === 0) && (
                  <p className='text-xs text-gray-400 mt-1'>
                    Add products first to enable paid amount
                  </p>
                )}
              </div>

              <div className='col-span-full'>
                <div className='flex justify-between items-center mb-1'>
                  <FormLabel>Description</FormLabel>
                  <span className='text-xs text-gray-500'>
                    {values.description?.length || 0} / 10,000 characters
                  </span>
                </div>
                <Field name='description'>
                  {({ field }: FieldProps) => (
                    <FormTextArea
                      {...field}
                      placeholder='Add Description'
                      rows={7}
                      maxLength={10000}
                    />
                  )}
                </Field>
                {errors.description && touched.description && (
                  <p className='text-red-500 text-sm mt-1'>{errors.description}</p>
                )}
              </div>

              <div className='col-span-full'>
                <div className='flex items-center justify-between mb-1'>
                  <FormLabel>Products*</FormLabel>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    radius='full'
                    leftIcon={<IconPlus className='size-4' />}
                    onClick={openAddProductSidebar}
                  >
                    Create Product
                  </Button>
                </div>
                <ProductCombobox
                  showSelectedValues={false}
                  value={values?.items?.map((item) => item.masterItemId) || []}
                  setValue={(ids) => {
                    if (!Array.isArray(ids)) return;

                    const productIds = ids;
                    const currentItemIds = values?.items?.map((item) => item.masterItemId) || [];

                    const newIds = productIds.filter((id) => !currentItemIds.includes(id));

                    const existingItems = (values?.items || []).filter((item) =>
                      productIds.includes(item.masterItemId),
                    );

                    const newItems = newIds.map((id) => ({
                      masterItemId: id,
                      quantity: 1,
                      discount: 0, // Start with 0, will inherit global discount during calculation
                      total: 0, // will be calculated in SelectedProductsTable
                      area: undefined,
                      areaId: undefined,
                      unitId: undefined,
                      attachmentId: undefined,
                      attachmentUrl: undefined,
                      gst: 18,
                    }));

                    const updatedItems = [...existingItems, ...newItems];

                    setFieldValue('items', updatedItems, false);
                  }}
                  name='items'
                  setTouched={(touched: boolean) => setFieldTouched('items', touched)}
                />
                {values?.items?.length > 0 && (
                  <>
                    <div className='flex flex-wrap items-center gap-2 mt-2'>
                      <FormLabel className='!mb-0 mr-2'>Areas</FormLabel>
                      {areas.length > 0 &&
                        areas.map((area) => (
                          <Badge
                            key={area.id}
                            variant='filled'
                            color='dark'
                            size='lg'
                            radius='xl'
                            className='font-normal bg-gray-900 text-white px-3 py-1.5'
                          >
                            {area.name}
                          </Badge>
                        ))}
                      <Button
                        type='button'
                        variant='light'
                        size='sm'
                        radius='full'
                        leftIcon={<IconPlus className='size-4' />}
                        onClick={openAddAreaModal}
                      >
                        Add Area
                      </Button>
                    </div>
                    <SelectedProductsTable />
                  </>
                )}
              </div>

              {/* Add Area Modal */}
              <Modal
                opened={isAddAreaModalOpen}
                onClose={() => {
                  closeAddAreaModal();
                  setAddAreaName('');
                }}
                title='Add Area'
                size='sm'
              >
                <div className='space-y-3'>
                  <TextInput
                    label='Area name'
                    placeholder='e.g. Living area, Bedroom'
                    value={addAreaName}
                    onChange={(e) => setAddAreaName(e.target.value)}
                  />
                  <Button
                    className='w-full'
                    disabled={!addAreaName.trim() || isCreatingArea}
                    onClick={async () => {
                      const name = addAreaName.trim();
                      if (!name) return;
                      try {
                        await createArea({ name }).unwrap();
                        toast.success('Area added');
                        closeAddAreaModal();
                        setAddAreaName('');
                      } catch (err: any) {
                        toast.error(err?.data?.message || 'Failed to add area');
                      }
                    }}
                  >
                    {isCreatingArea ? 'Adding...' : 'Create Area'}
                  </Button>
                </div>
              </Modal>

              {/* Payment Summary - Show only if paid amount > 0 */}
              {values.paidAmount > 0 && values.items && values.items.length > 0 && (
                <div className='col-span-full'>
                  <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                    <h3 className='text-sm font-semibold text-gray-700 mb-3'>Payment Summary</h3>
                    <div className='space-y-2'>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm text-gray-600'>Total Amount:</span>
                        <span className='text-sm font-medium text-gray-900'>
                          {prefixCurrencyInPrice(values.totalAmount || 0, 'INR', true)}
                        </span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm text-gray-600'>Paid Amount:</span>
                        <span className='text-sm font-medium text-green-600'>
                          -{prefixCurrencyInPrice(values.paidAmount || 0, 'INR', true)}
                        </span>
                      </div>
                      <hr className='my-2' />
                      <div className='flex justify-between items-center'>
                        <span className='text-base font-semibold text-gray-700'>
                          Remaining Amount:
                        </span>
                        <span className='text-base font-bold text-red-600'>
                          {prefixCurrencyInPrice(
                            Math.max(0, (values.totalAmount || 0) - (values.paidAmount || 0)),
                            'INR',
                            true,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Submit */}
            <div className='fixed bottom-0 bg-bg-light border-t py-3 flex w-[calc(100vw-4rem)] -mx-5 pr-8'>
              <Button radius='full' type='submit' disabled={isSubmitting} className='ml-auto'>
                {getButtonText('Quote', isSubmitting, mode)}
              </Button>
            </div>

            {/* Add Product Sidebar */}
            <AddProductSidebarWithHandler
              isOpen={isAddProductSidebarOpen}
              onClose={closeAddProductSidebar}
              onProductCreated={(productId: string) => setNewlyCreatedProductId(productId)}
            />
          </Form>
        );
      }}
    </Formik>
  );
}

function SelectedProductsTable() {
  const { values, setFieldValue } = useFormikContext<TCreateQuotationFormData>();

  const items = values.items || [];
  const productIds = items.map((item) => item.masterItemId);
  const globalDiscount = values.discount || 0;

  const { data } = useGetProductsQuery({ pageLimit: '100' }, { skip: !productIds.length });
  const { data: unitsData } = useGetUnitsQuery({ pageLimit: '100' });
  const { data: areasData } = useGetAreasQuery({ pageLimit: '100' });
  const unitOptions =
    unitsData?.units?.map((u) => ({ label: u.name || u.displayName, value: u.id })) || [];
  const areaOptions = areasData?.areas?.map((a) => ({ label: a.name, value: a.id })) || [];
  const areaIdToName = useMemo(
    () => new Map((areasData?.areas ?? []).map((a) => [a.id, a.name])),
    [areasData?.areas],
  );
  const [fetchProductById] = useLazyGetProductsQuery();
  const [uploadFiles, { isLoading: isUploadingImage }] = useUploadFilesMutation();
  const [productMap, setProductMap] = useState<Record<string, TProduct>>({});
  const prevGlobalDiscountRef = useRef<number | null>(null); // Initialize as null to trigger on first change
  const itemsLengthRef = useRef<number>(items.length);
  const productMapKeysRef = useRef<string>('');
  const fetchedIdsRef = useRef<Set<string>>(new Set());

  // 🧠 Merge products from main list into map
  useEffect(() => {
    if (!data?.masterItems?.length) return;

    setProductMap((prev) => {
      const next = { ...prev };
      data.masterItems.forEach((p: TProduct) => {
        next[p.id] = p;
        fetchedIdsRef.current.add(p.id);
      });
      return next;
    });
  }, [data?.masterItems]);

  // 🧠 Fetch missing products by ID when items change
  useEffect(() => {
    if (!productIds.length) return;

    // Check which products are missing and haven't been fetched yet
    const missingIds = productIds.filter((id) => !fetchedIdsRef.current.has(id));

    if (missingIds.length === 0) return;

    // Mark as being fetched to prevent duplicate requests
    missingIds.forEach((id) => fetchedIdsRef.current.add(id));

    // Fetch all missing products
    const fetchPromises = missingIds.map((id) =>
      fetchProductById({ id })
        .unwrap()
        .catch((error) => {
          console.error(`Failed to fetch product ${id}:`, error);
          return null;
        }),
    );

    Promise.all(fetchPromises).then((results) => {
      const productsToAdd: TProduct[] = [];
      results.forEach((result) => {
        if (result?.masterItems?.length) {
          productsToAdd.push(...result.masterItems);
        }
      });

      if (productsToAdd.length > 0) {
        setProductMap((prev) => {
          const next = { ...prev };
          productsToAdd.forEach((p: TProduct) => {
            next[p.id] = p;
          });
          return next;
        });
      }
    });
  }, [productIds, fetchProductById]);

  // 🧠 Calculate initial totals when products are loaded (for items with total: 0)
  useEffect(() => {
    if (!items.length || !productMap || Object.keys(productMap).length === 0) {
      itemsLengthRef.current = items.length;
      return;
    }

    const productMapKeys = Object.keys(productMap).sort().join(',');
    const itemsLength = items.length;

    // Only recalculate if:
    // 1. Items length changed (new items added)
    // 2. Product map changed (new products loaded)
    // 3. Items have total: 0 and products are available
    const itemsChanged = itemsLengthRef.current !== itemsLength;
    const productMapChanged = productMapKeysRef.current !== productMapKeys;

    if (!itemsChanged && !productMapChanged) {
      // Check if any items need calculation
      const needsCalculation = items.some((item) => {
        const product = productMap[item.masterItemId];
        return product && item.total === 0;
      });
      if (!needsCalculation) return;
    }

    itemsLengthRef.current = itemsLength;
    productMapKeysRef.current = productMapKeys;

    const currentItems = values.items || [];
    let hasChanges = false;
    const updatedItems = currentItems.map((item) => {
      const product = productMap[item.masterItemId];

      // Skip if product not loaded yet
      if (!product) return item;

      // Autofill unit from masterItem when not already set
      const unitIdFromProduct = product.unit?.id;
      const nextUnitId =
        item.unitId != null && item.unitId !== '' ? item.unitId : (unitIdFromProduct ?? undefined);
      const unitChanged = nextUnitId !== item.unitId;

      // Recalculate total when item has no total yet
      const needsTotalCalc = item.total === 0;
      const mrp = item.mrp !== undefined ? item.mrp : product.mrp || 0;
      const quantity = item.quantity || 1;
      const discount = item.discount === 0 ? globalDiscount : item.discount;
      const baseTotal = mrp * quantity;
      const discountAmount = (baseTotal * discount) / 100;
      const total = needsTotalCalc
        ? Math.round(Math.max(0, baseTotal - discountAmount) * 100) / 100
        : (item.total ?? 0);

      if (unitChanged || needsTotalCalc) hasChanges = true;

      return {
        ...item,
        ...(unitChanged ? { unitId: nextUnitId } : {}),
        ...(needsTotalCalc ? { discount, total } : {}),
      };
    });

    if (hasChanges) {
      setFieldValue('items', updatedItems, false);
    }
  }, [productMap, globalDiscount, setFieldValue, items.length, values.items]);

  // Helpers to recalc totals and update Formik
  const recalcItemTotal = useCallback(
    (index: number, quantity: number, discount: number) => {
      const currentItems = values.items || [];
      const item = currentItems[index];
      if (!item) return;

      const product = productMap[item.masterItemId];
      // Use item.mrp if available (editable), otherwise fall back to product.mrp
      const mrp = item.mrp !== undefined ? item.mrp : product?.mrp || 0;

      const baseTotal = mrp * quantity;
      const discountAmount = (baseTotal * (discount || 0)) / 100;
      const total = Math.round(Math.max(0, baseTotal - discountAmount) * 100) / 100; // Round to 2 decimal places

      const newItems = [...currentItems];
      newItems[index] = {
        ...item,
        quantity,
        discount,
        total,
      };

      setFieldValue('items', newItems, false);
    },
    [productMap, setFieldValue, values.items],
  );

  // Store latest productMap in ref to avoid dependency issues
  const productMapRef = useRef(productMap);

  useEffect(() => {
    productMapRef.current = productMap;
  }, [productMap]);

  // Store latest items in ref to avoid stale closure issues
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Initialize prevGlobalDiscountRef on mount
  useEffect(() => {
    if (prevGlobalDiscountRef.current === null) {
      prevGlobalDiscountRef.current = globalDiscount;
    }
  }, []);

  // 🧠 When global discount changes, apply it to all items and recalculate totals
  useEffect(() => {
    // Clamp global discount to valid range (0-100)
    const clampedDiscount = Math.min(100, Math.max(0, globalDiscount || 0));

    // Skip on initial mount (when prevGlobalDiscountRef is null)
    if (prevGlobalDiscountRef.current === null) {
      prevGlobalDiscountRef.current = clampedDiscount;
      return;
    }

    // Only update if global discount actually changed
    if (prevGlobalDiscountRef.current === clampedDiscount) return;

    const currentProductMap = productMapRef.current;
    const currentItems = itemsRef.current || [];

    if (!currentItems.length || !currentProductMap || Object.keys(currentProductMap).length === 0) {
      prevGlobalDiscountRef.current = clampedDiscount;
      return;
    }

    // Use a flag to prevent re-triggering
    let hasChanges = false;
    const updatedItems = currentItems.map((item) => {
      const product = currentProductMap[item.masterItemId];
      if (!product) return item;

      // Only update if discount actually changed
      if (item.discount === clampedDiscount) return item;

      hasChanges = true;
      // Apply global discount to all items when global discount changes
      // Use item.mrp if available (editable), otherwise fall back to product.mrp
      const mrp = item.mrp !== undefined ? item.mrp : product.mrp || 0;
      const quantity = item.quantity || 1;
      const baseTotal = mrp * quantity;
      const discountAmount = (baseTotal * clampedDiscount) / 100;
      const total = Math.round(Math.max(0, baseTotal - discountAmount) * 100) / 100; // Round to 2 decimal places

      return {
        ...item,
        discount: clampedDiscount, // Update item's discount to match global
        total,
      };
    });

    // Only update if there are actual changes
    if (hasChanges) {
      prevGlobalDiscountRef.current = clampedDiscount;
      setFieldValue('items', updatedItems, false);
    } else {
      prevGlobalDiscountRef.current = clampedDiscount;
    }
  }, [globalDiscount, setFieldValue]);

  const handleQuantityChange = (index: number, qty: number) => {
    if (typeof qty !== 'number' || qty < 1) return;
    const currentItems = values.items || [];
    const item = currentItems[index];
    if (!item) return;

    const discount = item.discount ?? 0;
    recalcItemTotal(index, qty, discount);
  };

  const handleDiscountChange = (index: number, disc: number) => {
    if (typeof disc !== 'number') return;
    // Clamp discount to valid range (0-100)
    const clampedDiscount = Math.min(100, Math.max(0, disc));
    const currentItems = values.items || [];
    const item = currentItems[index];
    if (!item) return;

    const quantity = item.quantity || 1;
    recalcItemTotal(index, quantity, clampedDiscount);
  };

  const handleMRPChange = (index: number, mrpValue: number) => {
    if (typeof mrpValue !== 'number' || mrpValue < 0) return;
    const currentItems = values.items || [];
    const item = currentItems[index];
    if (!item) return;

    const quantity = item.quantity || 1;
    const discount = item.discount ?? 0;

    // Update item with new MRP and recalculate total
    const baseTotal = mrpValue * quantity;
    const discountAmount = (baseTotal * discount) / 100;
    const total = Math.round(Math.max(0, baseTotal - discountAmount) * 100) / 100;

    const newItems = [...currentItems];
    newItems[index] = {
      ...item,
      mrp: mrpValue,
      total,
    };

    setFieldValue('items', newItems, false);
  };

  const handleDelete = (productId: string) => {
    const currentItems = values.items || [];
    const updatedItems = currentItems.filter((item) => item.masterItemId !== productId);
    setFieldValue('items', updatedItems);
  };

  const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 10 MB');
      return;
    }
    const formData = new FormData();
    formData.append('files', file);
    formData.append('folder', 'estatecraft-quotation-items');
    uploadFiles(formData)
      .unwrap()
      .then((res) => {
        const uploaded = res?.data?.files;
        if (uploaded?.length && uploaded[0]) {
          const first = uploaded[0];
          const newItems = [...(values.items || [])];
          newItems[index] = {
            ...newItems[index],
            attachmentId: first.id ?? undefined,
            attachmentUrl: first.url,
          };
          setFieldValue('items', newItems, false);
        } else {
          toast.error('Failed to upload image');
        }
      })
      .catch(() => toast.error('Failed to upload image'));
    e.target.value = '';
  };

  const grandTotal =
    Math.round((items.reduce((sum, item) => sum + (item.total || 0), 0) || 0) * 100) / 100; // Round to 2 decimal places

  // Group items by area (areaId or legacy area string) for combined display
  const areaGroups = useMemo(() => {
    const keyToGroup = new Map<
      string,
      { areaLabel: string; entries: { item: TQuotationItemForm; originalIndex: number }[] }
    >();
    const noAreaKey = '__no_area__';
    items.forEach((item, originalIndex) => {
      const key = (item.areaId ?? (item.area?.trim() || '')) || noAreaKey;
      const areaLabel =
        ((item.areaId ? areaIdToName.get(item.areaId) : null) ?? (item.area?.trim() || '')) || '—';
      if (!keyToGroup.has(key)) {
        keyToGroup.set(key, { areaLabel, entries: [] });
      }
      keyToGroup.get(key)!.entries.push({
        item: { ...item, gst: item.gst ?? undefined },
        originalIndex,
      });
    });
    return Array.from(keyToGroup.entries()).map(([areaKey, { areaLabel, entries }]) => ({
      areaKey,
      areaLabel,
      entries,
    }));
  }, [items, areaIdToName]);

  if (!items.length) return null;

  const colCount = 12; // S.No, Area, Image, Product, Unit, Qty, Price, Amount, Discount, GST, Total, Action

  return (
    <div className='flex flex-col mt-4'>
      <TableWrapper totalCount={items.length} showPagination={false}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>S. No</Table.Th>
            <Table.Th>Area</Table.Th>
            <Table.Th>Image</Table.Th>
            <Table.Th>Product &amp; Description</Table.Th>
            <Table.Th>Unit</Table.Th>
            <Table.Th>Qty</Table.Th>
            <Table.Th>Price</Table.Th>
            <Table.Th>Amount</Table.Th>
            <Table.Th>Discount (%)</Table.Th>
            <Table.Th>GST (%)</Table.Th>
            <Table.Th>Total</Table.Th>
            <Table.Th>Action</Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {areaGroups.map((group) => {
            const areaSubtotal = group.entries.reduce(
              (sum, { item }) => sum + (item.total || 0),
              0,
            );
            const roundedSubtotal = Math.round(areaSubtotal * 100) / 100;
            return (
              <Fragment key={group.areaKey}>
                {/* Area section header */}
                <Table.Tr className='bg-gray-100 border-y border-gray-200'>
                  <Table.Td colSpan={2} className='font-semibold text-gray-800 py-2'>
                    {group.areaLabel}
                  </Table.Td>
                  <Table.Td colSpan={colCount - 4} className='text-right text-gray-600 py-2' />
                  <Table.Td colSpan={2} className='text-right font-medium text-gray-800 py-2'>
                    Subtotal: {prefixCurrencyInPrice(roundedSubtotal, 'INR', true)}
                  </Table.Td>
                </Table.Tr>
                {/* Product rows in this area */}
                {group.entries.map(({ item, originalIndex: index }) => {
                  const product = productMap[item.masterItemId];
                  // Unit price (editable)
                  const price =
                    item.mrp != null && typeof item.mrp === 'number'
                      ? item.mrp
                      : (product?.mrp ?? 0);
                  const quantity = item.quantity || 1;
                  const amount = price * quantity; // Price * Qty
                  const currency = product?.currency || 'INR';
                  const gst = item.gst ?? 18;

                  return (
                    <Table.Tr key={item.masterItemId}>
                      {/* S. No */}
                      <TableData>{index + 1}</TableData>
                      {/* 1. Area */}
                      <TableData>
                        <FormSelect
                          options={[{ label: '— Select area —', value: '' }, ...areaOptions]}
                          value={item.areaId ?? ''}
                          onChange={(val) => {
                            const newItems = [...(values.items || [])];
                            const areaName = val ? (areaIdToName.get(val) ?? undefined) : undefined;
                            newItems[index] = {
                              ...item,
                              areaId: val || undefined,
                              area: areaName,
                            };
                            setFieldValue('items', newItems, false);
                          }}
                          placeholder='Select area'
                          className='w-40'
                        />
                      </TableData>
                      {/* 2. Image */}
                      <TableData>
                        <label className='cursor-pointer block w-[50px] h-[50px] rounded overflow-hidden border border-gray-200 hover:ring-2 hover:ring-primary/30 focus-within:ring-2 focus-within:ring-primary'>
                          <input
                            type='file'
                            accept='image/*'
                            className='sr-only'
                            disabled={isUploadingImage}
                            onChange={(e) => handleImageChange(index, e)}
                          />
                          {item.attachmentUrl || product?.primaryFile?.[0]?.url ? (
                            <Image
                              src={item.attachmentUrl || product?.primaryFile?.[0]?.url || ''}
                              width={50}
                              height={50}
                              alt='product'
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div className='w-[50px] h-[50px] bg-gray-100 rounded flex items-center justify-center border-0'>
                              <IconPhoto className='w-6 h-6 text-gray-400' />
                            </div>
                          )}
                        </label>
                      </TableData>
                      {/* 3. Product name and description */}
                      <TableData>
                        <div className='min-w-[140px]'>
                          <p className='font-medium text-gray-900'>{product?.name || 'N/A'}</p>
                          {product?.description ? (
                            <p className='text-xs text-gray-500 mt-0.5 line-clamp-2'>
                              {product.description}
                            </p>
                          ) : null}
                        </div>
                      </TableData>
                      {/* 4. Unit */}
                      <TableData>
                        <FormSelect
                          options={unitOptions}
                          value={item.unitId ?? null}
                          onChange={(val) => {
                            const newItems = [...(values.items || [])];
                            newItems[index] = { ...item, unitId: val || undefined };
                            setFieldValue('items', newItems, false);
                          }}
                          placeholder='Select unit'
                          className='w-32'
                        />
                      </TableData>
                      {/* 5. Qty */}
                      <TableData>
                        <NumberInput
                          min={1}
                          clampBehavior='strict'
                          allowNegative={false}
                          value={quantity}
                          onChange={(val) => {
                            if (typeof val !== 'number') return;
                            const qty = val < 1 ? 1 : val;
                            handleQuantityChange(index, qty);
                          }}
                          className='w-20'
                        />
                      </TableData>
                      {/* 6. Price (unit price) */}
                      <TableData>
                        <NumberInput
                          min={0}
                          clampBehavior='strict'
                          allowNegative={false}
                          value={price}
                          onChange={(val) => {
                            if (typeof val !== 'number') return;
                            const mrpValue = val < 0 ? 0 : val;
                            handleMRPChange(index, mrpValue);
                          }}
                          className='w-28'
                        />
                      </TableData>
                      {/* 7. Amount (price * qty) */}
                      <TableData className='font-medium'>
                        {prefixCurrencyInPrice(amount, currency, true)}
                      </TableData>
                      {/* 8. Discount (%) */}
                      <TableData>
                        <NumberInput
                          min={0}
                          max={100}
                          clampBehavior='strict'
                          allowNegative={false}
                          value={item.discount ?? 0}
                          onChange={(val) => {
                            if (typeof val !== 'number') return;
                            const clampedDiscount = val > 100 ? 100 : val < 0 ? 0 : val;
                            if (clampedDiscount !== (item.discount ?? 0)) {
                              handleDiscountChange(index, clampedDiscount);
                            }
                          }}
                          onBlur={() => {
                            const currentValue = item.discount ?? 0;
                            if (currentValue > 100) handleDiscountChange(index, 100);
                            else if (currentValue < 0) handleDiscountChange(index, 0);
                          }}
                          className='w-20'
                        />
                      </TableData>
                      {/* 9. GST (%) */}
                      <TableData>
                        <NumberInput
                          min={0}
                          max={100}
                          clampBehavior='strict'
                          allowNegative={false}
                          value={gst}
                          onChange={(val) => {
                            if (typeof val !== 'number') return;
                            const newItems = [...(values.items || [])];
                            newItems[index] = { ...item, gst: val < 0 ? 0 : val > 100 ? 100 : val };
                            setFieldValue('items', newItems, false);
                          }}
                          className='w-16'
                        />
                      </TableData>
                      {/* 11. Total */}
                      <TableData className='font-medium'>
                        {prefixCurrencyInPrice(item.total || 0, currency, true)}
                      </TableData>
                      {/* 12. Action */}
                      <Table.Td>
                        <DeleteButton
                          tooltip='Delete product'
                          onDelete={() => handleDelete(item.masterItemId)}
                        />
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Fragment>
            );
          })}
        </Table.Tbody>
      </TableWrapper>

      <hr className='w-full mt-2 mb-2' />

      {values.paidAmount === 0 ? (
        <p className='ml-auto'>
          Total Amount:{' '}
          <span className='font-medium'>{prefixCurrencyInPrice(grandTotal, 'INR', true)}</span>
        </p>
      ) : (
        <></>
      )}
    </div>
  );
}

function AddProductSidebarWithHandler({
  isOpen,
  onClose,
  onProductCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (productId: string) => void;
}) {
  const [createProduct, { isLoading: isCreatingProduct }] = useCreateProductMutation();
  const { refetch } = useGetProductsQuery({ pageLimit: '10' });

  const handleSubmit = async (data: TCreateProductFormData, resetForm: () => void) => {
    try {
      await createProduct(data).unwrap();
      toast.success('Product created successfully');
      // Refetch products to get the new product
      const refetchResult = await refetch();
      // Find the newly created product by name (since API doesn't return ID directly)
      const newProduct = refetchResult.data?.masterItems?.find(
        (p: TProduct) => p.name === data.name,
      );
      if (newProduct?.id) {
        onProductCreated(newProduct.id);
      }
      resetForm();
      onClose();
    } catch (error: any) {
      if (error?.data?.message) toast.error(error.data.message);
      else toast.error('Internal server error');
      console.error('Error creating Product:', error);
    }
  };

  return (
    <AddProductSidebar
      isOpen={isOpen}
      onClose={onClose}
      customOnSubmit={handleSubmit}
      isCreating={isCreatingProduct}
    />
  );
}
