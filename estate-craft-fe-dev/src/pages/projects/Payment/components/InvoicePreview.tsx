import { useFormikContext } from 'formik';
import type { TInvoiceFormData } from '../../../../types/payment.types';
import logo from '../../../../assets/img/logo.png';
import { format } from 'date-fns';
import { prefixCurrencyInPrice } from '../../../../utils/helper';

export default function InvoicePreview() {
  const { values } = useFormikContext<TInvoiceFormData>();

  // Calculate subtotal from items (price * quantity)
  const subtotal =
    values.items?.reduce((sum, item) => sum + (item.quantity * item.price || 0), 0) || 0;

  const taxRate = values.taxRate || 18; // Default to 18%
  const tax = values.tax || (subtotal * taxRate) / 100;
  const total = values.total || subtotal + tax;

  return (
    <div className='bg-white border border-gray-200 rounded-lg p-6 h-full overflow-y-auto flex flex-col'>
      <div className='space-y-6 flex-1'>
        {/* Header */}
        <div className='border-b pb-4'>
          <img src={logo} alt='Estate Craft' className='h-12 w-auto mb-2' />
          <div className='text-2xl font-bold'>{prefixCurrencyInPrice(total, 'INR')}</div>
        </div>

        {/* Invoice Details */}
        <div className='space-y-2'>
          <p className='text-sm font-bold text-gray-600'>
            Invoice from Estate Craft Interior Design Studio
          </p>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            {values.invoiceNumber && (
              <div>
                <span className='text-gray-600'>Invoice Number: </span>
                <span className='font-medium'>{values.invoiceNumber}</span>
              </div>
            )}
            <div>
              <span className='text-gray-600'>Due </span>
              <span className='font-medium'>
                {values.dueDate ? format(values.dueDate, 'dd MMMM yyyy') : 'Select due date'}
              </span>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className='space-y-2 border-t pt-4'>
          <div className='text-sm flex'>
            <span className='font-medium w-20'>To</span>
            <span className='font-medium mx-2'>:</span>
            <span className='text-gray-600 ml-8'>{values.clientName || "Enter Client's name"}</span>
          </div>
          <div className='text-sm flex'>
            <span className='font-medium w-20'>Address</span>
            <span className='font-medium mx-2'>:</span>
            <span className='text-gray-600 ml-8'>
              {values.clientAddress || "Enter Client's property address"}
            </span>
          </div>
        </div>

        {/* Items Table */}
        <div className='border-t pt-4'>
          <table className='w-full'>
            <thead>
              <tr className='border-b bg-gray-100'>
                <th className='text-left text-sm font-medium py-2 px-4'>Item</th>
                <th className='text-right text-sm font-medium py-2 px-4'>Qty</th>
                <th className='text-right text-sm font-medium py-2 px-4'>Amount</th>
              </tr>
            </thead>
            <tbody>
              {values.items && values.items.length > 0 ? (
                values.items.map((item, index) => {
                  const itemTotal = item.quantity * item.price;
                  return (
                    <tr key={index} className='border-b'>
                      <td className='py-2 text-sm'>{item.name || 'Item name'}</td>
                      <td className='text-right py-2 text-sm'>{item.quantity || 0}</td>
                      <td className='text-right py-2 text-sm'>
                        {prefixCurrencyInPrice(itemTotal, 'INR')}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className='py-2 text-sm text-gray-500 text-center'>
                    No items added
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className='border-t pt-4 space-y-2'>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-600'>Sub Total:</span>
            <span className='font-medium'>{prefixCurrencyInPrice(subtotal, 'INR')}</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-600'>TaxRate:</span>
            <span className='font-medium'>{taxRate}%</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-600'>Tax:</span>
            <span className='font-medium'>{prefixCurrencyInPrice(tax, 'INR')}</span>
          </div>
          <div className='flex justify-between text-lg font-bold border-t pt-2'>
            <span>Total:</span>
            <span>{prefixCurrencyInPrice(total, 'INR')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
