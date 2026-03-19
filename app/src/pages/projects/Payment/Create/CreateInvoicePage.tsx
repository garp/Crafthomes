import { Formik, Form, Field, type FieldProps, useFormikContext } from 'formik';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../../components/base';
import Container from '../../../../components/common/Container';
import BackButton from '../../../../components/base/button/BackButton';
import FormLabel from '../../../../components/base/FormLabel';
import FormInput from '../../../../components/base/FormInput';
import FormDate from '../../../../components/base/FormDate';
import ClientSelector from '../../../../components/common/selectors/ClientSelector';
import InvoicePreview from '../components/InvoicePreview';
import { createInvoiceSchema, type TCreateInvoiceFormData } from '../../../../validators/invoice';
import { useState, useEffect } from 'react';
import { IconPlus, IconPencil, IconTrash } from '@tabler/icons-react';
import { NumberInput } from '@mantine/core';
import type { TInvoiceItem } from '../../../../types/payment.types';
import { useGetClientsQuery } from '../../../../store/services/client/clientSlice';
import { useCreateInvoiceMutation } from '../../../../store/services/payment/paymentSlice';
import { useGetProjectsQuery } from '../../../../store/services/project/projectSlice';
import { toast } from 'react-toastify';

function InvoiceItemsSection() {
  const { values, setFieldValue } = useFormikContext<TCreateInvoiceFormData>();
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<TInvoiceItem>({
    name: '',
    quantity: 1,
    price: 0,
    total: 0,
  });

  const items = values.items || [];

  function addItem() {
    if (newItem.name && newItem.quantity > 0 && newItem.price >= 0) {
      const itemTotal = newItem.quantity * newItem.price;
      const itemWithTotal = { ...newItem, total: itemTotal };
      setFieldValue('items', [...items, itemWithTotal]);
      setNewItem({ name: '', quantity: 1, price: 0, total: 0 });
    }
  }

  function removeItem(index: number) {
    const newItems = items.filter((_, i) => i !== index);
    setFieldValue('items', newItems);
    const newExpanded = new Set(expandedItems);
    newExpanded.delete(index);
    setExpandedItems(newExpanded);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  }

  function toggleExpand(index: number) {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
      setEditingIndex(null);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  }

  function handleEditClick(index: number, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingIndex(index);
    const newExpanded = new Set(expandedItems);
    newExpanded.add(index);
    setExpandedItems(newExpanded);
  }

  function updateItemTotal(index: number) {
    const item = items[index];
    if (item) {
      const total = (item.quantity || 0) * (item.price || 0);
      setFieldValue(`items.${index}.total`, total);
    }
  }

  function updateItemField(index: number, field: keyof TInvoiceItem, value: string | number) {
    setFieldValue(`items.${index}.${field}`, value);
    updateItemTotal(index);
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <FormLabel>Add Items</FormLabel>
        <button
          type='button'
          onClick={addItem}
          className='flex items-center gap-2 text-blue-600 hover:text-blue-700 cursor-pointer'
          disabled={!newItem.name || newItem.quantity < 1 || newItem.price < 0}
        >
          <IconPlus className='size-4' />
          <span className='text-sm font-medium'>Add Item</span>
        </button>
      </div>

      <div className='space-y-3'>
        {items.map((item: TInvoiceItem, index: number) => {
          const isExpanded = expandedItems.has(index);
          return (
            <div key={index} className='border rounded-md'>
              {/* Header */}
              <div className='flex items-center bg-gray-50 px-4 py-3'>
                <button
                  type='button'
                  onClick={() => toggleExpand(index)}
                  className='flex-1 text-left font-medium text-sm cursor-pointer'
                >
                  {item.name || 'Item name'}
                </button>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={(e) => handleEditClick(index, e)}
                    className='p-1 hover:bg-gray-200 rounded cursor-pointer'
                    title='Edit item'
                  >
                    <IconPencil className='size-4 text-gray-600' />
                  </button>
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(index);
                    }}
                    className='p-1 hover:bg-gray-200 rounded cursor-pointer'
                    title='Remove item'
                  >
                    <IconTrash className='size-4 text-red-600' />
                  </button>
                  <button
                    type='button'
                    onClick={() => toggleExpand(index)}
                    className='p-1 hover:bg-gray-200 rounded cursor-pointer'
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 9l-7 7-7-7'
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className='p-4 space-y-4'>
                  <div>
                    <FormLabel>Item name</FormLabel>
                    <Field name={`items.${index}.name`}>
                      {({ field }: FieldProps) => (
                        <FormInput
                          {...field}
                          placeholder='Enter Item name'
                          className='mt-1'
                          onChange={(e) => {
                            field.onChange(e);
                            updateItemField(index, 'name', e.target.value);
                          }}
                        />
                      )}
                    </Field>
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <FormLabel>Quantity</FormLabel>
                      <NumberInput
                        min={1}
                        value={item.quantity || 1}
                        onChange={(val) => {
                          const qty = typeof val === 'number' ? val : 1;
                          updateItemField(index, 'quantity', qty);
                        }}
                        placeholder='Enter Quantity'
                        className='mt-1'
                      />
                    </div>
                    <div>
                      <FormLabel>Price</FormLabel>
                      <NumberInput
                        min={0}
                        value={item.price || 0}
                        onChange={(val) => {
                          const price = typeof val === 'number' ? val : 0;
                          updateItemField(index, 'price', price);
                        }}
                        placeholder='Enter Price'
                        className='mt-1'
                      />
                    </div>
                  </div>
                  <div className='flex justify-end'>
                    <Button
                      type='button'
                      onClick={() => {
                        setEditingIndex(null);
                        const newExpanded = new Set(expandedItems);
                        newExpanded.delete(index);
                        setExpandedItems(newExpanded);
                      }}
                      className='!text-sm'
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add New Item Form */}
      <div className='border rounded-md p-4 space-y-4 bg-gray-50'>
        <div>
          <FormLabel>Item name</FormLabel>
          <FormInput
            placeholder='Enter Item name'
            className='mt-1'
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          />
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <FormLabel>Quantity</FormLabel>
            <NumberInput
              placeholder='Enter Quantity'
              className='mt-1'
              min={1}
              value={newItem.quantity}
              onChange={(val) =>
                setNewItem({ ...newItem, quantity: typeof val === 'number' ? val : 1 })
              }
            />
          </div>
          <div>
            <FormLabel>Price</FormLabel>
            <NumberInput
              placeholder='Enter Price'
              className='mt-1'
              min={0}
              value={newItem.price}
              onChange={(val) =>
                setNewItem({ ...newItem, price: typeof val === 'number' ? val : 0 })
              }
            />
          </div>
        </div>
        <div className='flex justify-end'>
          <Button
            type='button'
            onClick={addItem}
            className='!text-sm'
            disabled={!newItem.name || newItem.quantity < 1 || newItem.price < 0}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function TotalCalculator() {
  const { values, setFieldValue } = useFormikContext<TCreateInvoiceFormData>();

  useEffect(() => {
    const subtotal =
      values.items?.reduce(
        (sum: number, item: TInvoiceItem) => sum + (item.quantity * item.price || 0),
        0,
      ) || 0;
    const taxRate = 18; // Hardcoded as per requirements
    const tax = (subtotal * taxRate) / 100;
    const total = subtotal + tax;

    setFieldValue('subtotal', subtotal);
    setFieldValue('taxRate', taxRate);
    setFieldValue('tax', tax);
    setFieldValue('total', total);
  }, [values.items, setFieldValue]);

  return null;
}

function ClientNameUpdater({
  selectedClient,
}: {
  selectedClient: { id: string; name: string; location?: string } | null;
}) {
  const { setFieldValue } = useFormikContext<TCreateInvoiceFormData>();

  useEffect(() => {
    if (selectedClient) {
      setFieldValue('clientName', selectedClient.name);
      setFieldValue('clientAddress', selectedClient.location || '');
    }
  }, [selectedClient, setFieldValue]);

  return null;
}

export default function CreateInvoicePage() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { data: clientsData } = useGetClientsQuery({ pageLimit: '100' });
  const { data: projectData } = useGetProjectsQuery(
    { id: projectId || '', pageLimit: '1' },
    { skip: !projectId },
  );
  const project = projectData?.projects?.[0];
  const projectClient = project?.client;
  const projectClientId = project?.clientId ?? projectClient?.id;

  const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceMutation();
  const [selectedClient, setSelectedClient] = useState<{
    id: string;
    name: string;
    location?: string;
  } | null>(null);

  // Autofill client from project when project has a client
  useEffect(() => {
    if (projectClientId && projectClient) {
      setSelectedClient({
        id: projectClientId,
        name: projectClient.name ?? '',
        location: projectClient.location ?? '',
      });
    }
  }, [projectClientId, projectClient?.name, projectClient?.location]);

  const initialValues: TCreateInvoiceFormData & { clientName?: string; clientAddress?: string } = {
    clientId: projectClientId ?? null,
    dueDate: null,
    items: [],
    taxRate: 18,
    tax: 0,
    subtotal: 0,
    total: 0,
    clientName: projectClient?.name ?? '',
    clientAddress: projectClient?.location ?? '',
  };

  async function handleSubmit(values: TCreateInvoiceFormData, { setSubmitting }: any) {
    console.log('Form submitted with values:', values);

    if (!projectId) {
      toast.error('Project ID is missing');
      setSubmitting(false);
      return;
    }

    if (!values.clientId) {
      toast.error('Please select a client');
      setSubmitting(false);
      return;
    }

    if (!values.dueDate) {
      toast.error('Please select a due date');
      setSubmitting(false);
      return;
    }

    if (!values.items || values.items.length === 0) {
      toast.error('Please add at least one item');
      setSubmitting(false);
      return;
    }

    // Validate items have required fields
    const invalidItems = values.items.filter(
      (item) =>
        !item.name ||
        !item.quantity ||
        item.quantity < 1 ||
        item.price === undefined ||
        item.price < 0,
    );
    if (invalidItems.length > 0) {
      toast.error('Please ensure all items have valid name, quantity, and price');
      setSubmitting(false);
      return;
    }

    try {
      // Convert dueDate to Date object if it's a string
      let dueDateISO: string;
      if (values.dueDate instanceof Date) {
        dueDateISO = values.dueDate.toISOString();
      } else if (typeof values.dueDate === 'string') {
        // If it's a string, convert to Date first
        const dateObj = new Date(values.dueDate);
        if (isNaN(dateObj.getTime())) {
          toast.error('Invalid due date');
          setSubmitting(false);
          return;
        }
        dueDateISO = dateObj.toISOString();
      } else {
        toast.error('Please select a valid due date');
        setSubmitting(false);
        return;
      }

      const payload = {
        projectId,
        clientId: values.clientId,
        dueDate: dueDateISO,
        items: values.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        subTotalAmount: values.subtotal || 0,
        discount: 0,
        tax: 18,
        totalAmount: values.total || 0,
      };

      console.log('Sending payload:', payload);
      const result = await createInvoice(payload).unwrap();
      console.log('Invoice created successfully:', result);
      toast.success('Invoice created successfully');
      navigate(`/projects/${projectId}/payment`);
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      const errorMessage =
        error?.data?.message || error?.data?.error || error?.message || 'Failed to create invoice';
      toast.error(errorMessage);
      setSubmitting(false);
    }
  }

  function handleClientChange(clientId: string | null) {
    if (clientId && clientsData?.clients) {
      const client = clientsData.clients.find((c) => c.id === clientId);
      if (client) {
        setSelectedClient({ id: client.id, name: client.name, location: client.location });
      }
    } else {
      setSelectedClient(null);
    }
  }

  // Get minimum date (today)
  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);

  return (
    <Container className='relative px-0 py-0 overflow-y-auto border max-h-[calc(100vh-11rem)] pb-20'>
      <BackButton className='px-5 pt-5' backTo={`/projects/${projectId}/payment`}>
        CREATE INVOICE
      </BackButton>
      <Formik
        initialValues={initialValues}
        validationSchema={createInvoiceSchema}
        enableReinitialize
        onSubmit={handleSubmit}
        validateOnChange={false}
        validateOnBlur={false}
      >
        {({ values, setFieldValue, errors, touched, isSubmitting, validateForm }) => {
          // Debug: Log validation errors
          if (Object.keys(errors).length > 0) {
            console.log('Form validation errors:', errors);
            console.log('Touched fields:', touched);
          }

          // Custom submit handler that validates and submits
          const handleFormSubmit = async (e?: React.FormEvent) => {
            e?.preventDefault();
            console.log('Submit button clicked');

            // Validate form
            const validationErrors = await validateForm();
            console.log('Validation result:', validationErrors);

            if (Object.keys(validationErrors).length > 0) {
              console.log('Validation failed:', validationErrors);
              toast.error('Please fix the form errors before submitting');
              return;
            }

            // If validation passes, call handleSubmit manually
            handleSubmit(values, { setSubmitting: () => {} });
          };

          return (
            <Form className='grid lg:grid-cols-2 gap-6 px-5 pt-5'>
              <TotalCalculator />
              <ClientNameUpdater selectedClient={selectedClient} />
              {/* Left Column - Form */}
              <div className='space-y-6'>
                <div>
                  <FormLabel>Send to</FormLabel>
                  <ClientSelector
                    value={values.clientId}
                    setValue={(val) => {
                      setFieldValue('clientId', val);
                      handleClientChange(val);
                    }}
                    error={touched.clientId ? errors.clientId : undefined}
                    className='mt-1'
                  />
                </div>

                <div>
                  <FormLabel>Due Date</FormLabel>
                  <FormDate
                    value={values.dueDate}
                    onChange={(date) => setFieldValue('dueDate', date)}
                    placeholder='Select Due Date'
                    error={touched.dueDate ? errors.dueDate : undefined}
                    className='mt-1'
                    minDate={minDate}
                  />
                </div>

                <InvoiceItemsSection />
              </div>

              {/* Right Column - Preview */}
              <div className='lg:sticky lg:top-5 h-fit flex flex-col'>
                <div className='mb-4'>
                  <h3 className='font-bold text-sm'>Preview</h3>
                </div>
                <InvoicePreview />
                {/* Action Buttons */}
                <div className='flex justify-end gap-4 pt-12 mt-auto'>
                  <Button
                    type='button'
                    variant='outline'
                    className='border-black'
                    radius='full'
                    onClick={() => navigate(`/projects/${projectId}/payment`)}
                  >
                    Save as draft
                  </Button>
                  <Button
                    type='button'
                    onClick={() => handleFormSubmit()}
                    className='bg-black text-white'
                    radius='full'
                    disabled={isCreating || isSubmitting}
                  >
                    {isCreating || isSubmitting ? 'Sending...' : 'Send Invoice'}
                  </Button>
                </div>
              </div>
            </Form>
          );
        }}
      </Formik>
    </Container>
  );
}
