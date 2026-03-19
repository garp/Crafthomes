import { Fragment, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { IconDownload } from '@tabler/icons-react';

import { Table } from '@mantine/core';

import { Button, CrafthomesWordmark, EditIcon, Image } from '../../../../components';
import Container from '../../../../components/common/Container';
import IconButton from '../../../../components/base/button/IconButton';
import BackButton from '../../../../components/base/button/BackButton';
import TableData from '../../../../components/base/table/TableData';
import { useGetProjectQuotationsQuery } from '../../../../store/services/projectQuotation/projectQuotationSlice';
// import {
//   useGetProjectTimelineQuery,
//   useGetTimelineByIdQuery,
// } from '../../../../store/services/projectTimeline/projectTimelineSlice';
// import { useGetActivitiesQuery } from '../../../../store/services/commentAndActivities/activitiesSlice';
import { format } from 'date-fns';
import { QuotationSkeleton } from '../../../../components/base/Skeletons';
import { Link } from 'react-router-dom';
import { prefixCurrencyInPrice } from '../../../../utils/helper';
import { generateQuotationPDF } from '../../../../utils/pdfGenerator';

// Fallback company details (used when policy is null)
const FALLBACK_COMPANY_NAME = 'Crafthomes';
const FALLBACK_COMPANY_ADDRESS = '';
const FALLBACK_COMPANY_PHONE = '';

// Fallback account details (used when policy is null)
const FALLBACK_ACCOUNT_NAME = 'Crafthomes';
const FALLBACK_BANK = '';
const FALLBACK_ACCOUNT_NUMBER = '';
const FALLBACK_IFSC = '';
const FALLBACK_BRANCH = '';
const FALLBACK_GST_NO = '';

// Fallback Terms & Conditions (used when policy is null)
const FALLBACK_TERMS_AND_CONDITIONS = [
  'These Terms & Conditions apply to all purchases from Crafthomes. Please read them carefully.',
  'Product Representation: Designs and accessories shown are for representation only.',
  'Image and Color Variations: Images and colors are for reference and can vary.',
  'Delivery Periods: As per agreement.',
  'Order Placement: Requires advance payment and client sign-off.',
  'Assembly & Installation: As per agreement.',
  'Warranties: As per product specifications.',
];

export default function ViewQuotationPage() {
  const { quotationId, id } = useParams();
  const {
    data: quotationData,
    isLoading: isLoadingQuotation,
    isError,
  } = useGetProjectQuotationsQuery({
    id: quotationId,
  });
  const quotation = quotationData?.quotations?.at(0);

  // Get items from quotationItem (API response) or items (legacy)
  const quotationItems = (quotation as any)?.quotationItem || quotation?.items || [];

  // Group items by area for combined display
  const areaGroups = useMemo(() => {
    const keyToGroup = new Map<string, { areaLabel: string; items: any[] }>();
    const noAreaKey = '__no_area__';
    quotationItems.forEach((item: any) => {
      const raw =
        (item.areaRef?.name ?? item.area) != null
          ? String(item.areaRef?.name ?? item.area).trim()
          : '';
      const key = (item.areaId ?? raw) || noAreaKey;
      const areaLabel = raw || '—';
      if (!keyToGroup.has(key)) {
        keyToGroup.set(key, { areaLabel, items: [] });
      }
      keyToGroup.get(key)!.items.push(item);
    });
    return Array.from(keyToGroup.entries()).map(([key, { areaLabel, items }]) => ({
      areaKey: key,
      areaLabel,
      items,
    }));
  }, [quotationItems]);

  const handleDownloadPDF = async () => {
    await generateQuotationPDF(quotation);
  };

  // Calculate totals
  const totalPrice = quotationItems.reduce((sum: number, item: any) => {
    // Prioritize item.mrp (editable MRP) over masterItem.mrp
    const itemPrice = item.mrp || item.masterItem?.mrp || item.price || 0;
    const quantity = item.quantity || 1;
    return sum + itemPrice * quantity;
  }, 0);

  const totalDiscount = quotationItems.reduce((sum: number, item: any) => {
    // Prioritize item.mrp (editable MRP) over masterItem.mrp
    const itemPrice = item.mrp || item.masterItem?.mrp || item.price || 0;
    const quantity = item.quantity || 1;
    const discount = item.discount || 0;
    return sum + itemPrice * quantity * (discount / 100);
  }, 0);

  const totalGST = quotationItems.reduce((sum: number, item: any) => {
    const gst = item.gst || 0;
    // Prioritize item.mrp (editable MRP) over masterItem.mrp
    const itemPrice = item.mrp || item.masterItem?.mrp || item.price || 0;
    const quantity = item.quantity || 1;
    const discount = item.discount || 0;
    const priceAfterDiscount = itemPrice * quantity * (1 - discount / 100);
    return sum + priceAfterDiscount * (gst / 100);
  }, 0);

  const grandTotal = quotation?.totalAmount || 0;
  const paidAmount = quotation?.paidAmount || 0;
  const remainingAmount = Math.max(0, grandTotal - paidAmount);

  // Get current date and time
  const currentDate = new Date();
  const formattedDate = format(currentDate, 'dd/MM/yyyy');

  // Get quotation date
  const quotationDate = quotation?.startDate
    ? format(new Date(quotation.startDate), 'MMM dd, yyyy')
    : formattedDate;

  // Get client address (first address or location)
  // Note: client object in quotation might have addresses even if not in type definition
  const clientData = quotation?.client as any;
  const clientAddress = clientData?.addresses?.[0]
    ? [
        clientData.addresses[0].building,
        clientData.addresses[0].street,
        clientData.addresses[0].locality,
        clientData.addresses[0].city,
        clientData.addresses[0].state,
        clientData.addresses[0].pincode ? `PIN: ${clientData.addresses[0].pincode}` : null,
      ]
        .filter(Boolean)
        .join(', ')
    : [clientData?.address, clientData?.city, clientData?.state].filter(Boolean).join(', ') ||
      'N/A';

  // Get policy data or use fallbacks
  const policy = (quotation as any)?.policy;
  const policyLogoUrl = policy?.logo as string | undefined;

  // Account details from policy
  const accountName = policy?.bankAccountName || policy?.companyName || FALLBACK_ACCOUNT_NAME;
  const bank = policy?.bankName || FALLBACK_BANK;
  const accountNumber = policy?.bankAccountNumber || FALLBACK_ACCOUNT_NUMBER;
  const ifsc = policy?.bankIFSC || FALLBACK_IFSC;
  const branch = policy?.bankBranch || FALLBACK_BRANCH;
  const gstNo = policy?.gstIn || FALLBACK_GST_NO;

  // Footer details from policy
  const footerCompanyName = policy?.companyName || FALLBACK_COMPANY_NAME;
  const footerAddress = policy?.address || FALLBACK_COMPANY_ADDRESS;
  const footerCity = policy?.city || '';
  const footerState = policy?.state || '';
  const footerPincode = policy?.pincode || '';
  const footerCountry = policy?.country || '';

  // Build full address
  const fullAddress = policy
    ? [
        footerAddress,
        footerCity,
        footerState,
        footerPincode ? `PIN: ${footerPincode}` : null,
        footerCountry,
      ]
        .filter(Boolean)
        .join(', ')
    : FALLBACK_COMPANY_ADDRESS;

  // Terms & Conditions from policy (HTML) or fallback
  const termsAndConditions = policy?.termsAndConditions || null;

  return (
    <Container className='h-full'>
      <div className='flex justify-between mb-4'>
        <BackButton backTo={`/projects/${id}/quotation`}>QUOTATION</BackButton>
        <div className='flex gap-2 items-center'>
          <IconButton onClick={handleDownloadPDF}>
            <IconDownload className='size-5' />
          </IconButton>
          <Link to={`/projects/${id}/quotation/edit/${quotationId}`}>
            <Button
              radius='full'
              className='!h-10 !bg-white px-10 !text-sm !font-medium'
              rightIcon={<EditIcon />}
              variant='outline'
            >
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {isLoadingQuotation || isError ? (
        <QuotationSkeleton />
      ) : (
        <div className='bg-white p-8 rounded-lg shadow-sm min-w-0 w-full'>
          {/* Header with Logo + Company Name + HR */}
          <div className='mb-8'>
            <div className='flex items-center gap-4 mb-4 flex-wrap'>
              {policyLogoUrl ? (
                <Image
                  src={policyLogoUrl}
                  alt='Company Logo'
                  className='h-12 w-auto'
                  objectFit='contain'
                />
              ) : (
                <CrafthomesWordmark className='text-xl' />
              )}
              {(policyLogoUrl || policy?.companyName) && (
                <h1 className='text-xl font-bold text-gray-900'>{footerCompanyName}</h1>
              )}
            </div>
            <hr className='border-gray-300' />
          </div>

          {/* Bill To and Quote Section */}
          <div className='grid grid-cols-2 gap-8 mb-8'>
            {/* Bill To Section */}
            <div>
              <h2 className='text-lg font-semibold mb-2'>Bill To:</h2>
              <p className='font-bold text-lg text-gray-800 mb-1'>
                {quotation?.client?.name || 'N/A'}
              </p>
              <p className='text-sm text-gray-600 leading-relaxed'>{clientAddress}</p>
            </div>

            {/* Quote Section */}
            <div className='pr-8'>
              <h2 className='text-4xl font-bold mb-4'>Quote</h2>
              <div className='space-y-0 text-sm'>
                <div className='flex justify-between items-center py-2 border-b border-gray-300'>
                  <span className='font-semibold'>Date:</span>
                  <span className='text-gray-700 font-medium'>{quotationDate}</span>
                </div>
                <div className='flex justify-between items-center py-2'>
                  <span className='font-semibold'>Account Name</span>
                  <span className='text-gray-700 font-medium'>{accountName}</span>
                </div>
                <div className='flex justify-between items-center py-2'>
                  <span className='font-semibold'>Bank</span>
                  <span className='text-gray-700 font-medium'>{bank}</span>
                </div>
                <div className='flex justify-between items-center py-2'>
                  <span className='font-semibold'>Account Number</span>
                  <span className='text-gray-700 font-medium'>{accountNumber}</span>
                </div>
                <div className='flex justify-between items-center py-2'>
                  <span className='font-semibold'>IFSC</span>
                  <span className='text-gray-700 font-medium'>{ifsc}</span>
                </div>
                <div className='flex justify-between items-center py-2'>
                  <span className='font-semibold'>Branch</span>
                  <span className='text-gray-700 font-medium'>{branch}</span>
                </div>
                <div className='flex justify-between items-center py-2 border-b border-gray-300'>
                  <span className='font-semibold'>GST NO</span>
                  <span className='text-gray-700 font-medium'>{gstNo}</span>
                </div>
                {quotation?.quoteId && (
                  <div className='flex justify-between items-center py-2 mt-3 pt-3'>
                    <span className='font-semibold'>Quote ID:</span>
                    <span className='text-gray-700 font-medium'>{quotation.quoteId}</span>
                  </div>
                )}
                {quotation?.name && (
                  <div className='flex justify-between items-center py-2'>
                    <span className='font-semibold'>Quotation Name:</span>
                    <span className='text-gray-700 font-medium'>{quotation.name}</span>
                  </div>
                )}
                {quotation?.description && (
                  <div className='mt-3 pt-3 border-t border-gray-300'>
                    <div className='flex justify-between items-start py-2'>
                      <span className='font-semibold'>Description:</span>
                      <span className='text-gray-700 font-medium text-right max-w-xs'>
                        {quotation.description}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Details Table */}
          <div className='mb-8 overflow-x-auto min-w-0 w-full'>
            <Table verticalSpacing={'sm'} withColumnBorders withTableBorder>
              <Table.Thead className='bg-neutral-100'>
                <Table.Tr>
                  <Table.Th className='!border-none text-center'>S. No</Table.Th>
                  <Table.Th className='!border-none text-center'>Area</Table.Th>
                  <Table.Th className='!border-none text-center'>Image</Table.Th>
                  <Table.Th className='!border-none'>Product &amp; Description</Table.Th>
                  <Table.Th className='!border-none text-center'>Unit</Table.Th>
                  <Table.Th className='!border-none text-center'>Qty</Table.Th>
                  <Table.Th className='!border-none text-center'>Price</Table.Th>
                  <Table.Th className='!border-none text-center'>Amount</Table.Th>
                  <Table.Th className='!border-none text-center'>Discount</Table.Th>
                  <Table.Th className='!border-none text-center'>GST</Table.Th>
                  <Table.Th className='!border-none text-center'>Total</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {quotationItems.length > 0 ? (
                  areaGroups.map((group) => {
                    const areaSubtotal = group.items.reduce(
                      (sum: number, item: any) => sum + (item.total || 0),
                      0,
                    );
                    const roundedSubtotal = Math.round(areaSubtotal * 100) / 100;
                    return (
                      <Fragment key={group.areaKey}>
                        <Table.Tr className='bg-gray-100'>
                          <Table.Td colSpan={2} className='font-semibold text-gray-800 py-2'>
                            {group.areaLabel}
                          </Table.Td>
                          <Table.Td colSpan={7} className='text-right text-gray-600 py-2' />
                          <Table.Td
                            colSpan={2}
                            className='text-right font-medium text-gray-800 py-2'
                          >
                            Subtotal: {prefixCurrencyInPrice(roundedSubtotal, 'INR', true)}
                          </Table.Td>
                        </Table.Tr>
                        {group.items.map((item: any, idx: number) => {
                          const itemName = item.masterItem?.name || item.name || 'N/A';
                          const itemDescription =
                            item.masterItem?.description || item.description || '—';
                          const itemPrice = item.mrp || item.masterItem?.mrp || item.price || 0;
                          const quantity = item.quantity || 1;
                          const discount = item.discount || 0;
                          const gst = item.gst || 0;
                          const total = item.total || 0;
                          const currency = item.masterItem?.currency || 'INR';
                          const itemImage =
                            item.attachment?.url ||
                            item.masterItem?.primaryFile?.[0]?.url ||
                            item.masterItem?.primaryFile?.[0]?.key ||
                            null;
                          const amount = itemPrice * quantity;

                          return (
                            <Table.Tr key={item.id || `${group.areaKey}-${idx}`}>
                              <TableData className='text-center'>{idx + 1}</TableData>
                              <TableData className='text-center'>
                                {(item.areaRef?.name ?? item.area)
                                  ? String(item.areaRef?.name ?? item.area).trim()
                                  : '—'}
                              </TableData>
                              <TableData className='text-center'>
                                {itemImage ? (
                                  <Image
                                    src={itemImage}
                                    alt={itemName}
                                    className='w-16 h-16 object-cover rounded'
                                    objectFit='cover'
                                    rounded='md'
                                  />
                                ) : (
                                  <span className='text-gray-400'>—</span>
                                )}
                              </TableData>
                              <TableData>
                                <p className='font-medium'>{itemName}</p>
                                {itemDescription && itemDescription !== '—' ? (
                                  <p className='text-sm text-gray-600 mt-0.5'>{itemDescription}</p>
                                ) : null}
                              </TableData>
                              <TableData className='text-center'>
                                {item.unit?.name || item.unit?.displayName || '—'}
                              </TableData>
                              <TableData className='text-center'>{quantity}</TableData>
                              <TableData className='text-center'>
                                {prefixCurrencyInPrice(itemPrice, currency, true)}
                              </TableData>
                              <TableData className='text-center'>
                                {prefixCurrencyInPrice(amount, currency, true)}
                              </TableData>
                              <TableData className='text-center'>{discount}%</TableData>
                              <TableData className='text-center'>{gst}%</TableData>
                              <TableData className='text-center font-semibold'>
                                {prefixCurrencyInPrice(total, currency, true)}
                              </TableData>
                            </Table.Tr>
                          );
                        })}
                      </Fragment>
                    );
                  })
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={11} className='text-center py-8 text-text-subHeading'>
                      No items found
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </div>

          {/* Summary of Charges */}
          <div className='flex justify-end mb-8'>
            <div className='w-80 space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-700'>Total Price:</span>
                <span className='font-medium'>
                  {prefixCurrencyInPrice(totalPrice, 'INR', true)}
                </span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-700'>Total Discount:</span>
                <span className='font-medium'>
                  {prefixCurrencyInPrice(totalDiscount, 'INR', true)}
                </span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-700'>Total GST:</span>
                <span className='font-medium'>{prefixCurrencyInPrice(totalGST, 'INR', true)}</span>
              </div>
              {paidAmount > 0 && (
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-700'>Paid Amount:</span>
                  <span className='font-medium text-green-600'>
                    {prefixCurrencyInPrice(paidAmount, 'INR', true)}
                  </span>
                </div>
              )}
              {remainingAmount > 0 && (
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-700'>Remaining Amount:</span>
                  <span className='font-medium text-red-600'>
                    {prefixCurrencyInPrice(remainingAmount, 'INR', true)}
                  </span>
                </div>
              )}
              <div className='flex justify-between text-base font-bold pt-2 border-t-2 border-gray-300'>
                <span>Grand Total:</span>
                <span>{prefixCurrencyInPrice(grandTotal, 'INR', true)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className='mb-8 mt-12 pt-8 border-t border-gray-200'>
            <h2 className='text-xl font-bold mb-8 text-center'>Terms & Conditions</h2>
            {termsAndConditions ? (
              <div
                className='tnc-content text-sm text-gray-800 max-w-none'
                dangerouslySetInnerHTML={{ __html: termsAndConditions }}
                style={{
                  lineHeight: '1.6',
                }}
              />
            ) : (
              <div className='space-y-3 text-sm text-gray-800'>
                {FALLBACK_TERMS_AND_CONDITIONS.map((term, index) => (
                  <p key={index} className='leading-relaxed flex items-start gap-3 ml-4'>
                    <span className='text-gray-600'>•</span>
                    <span>{term}</span>
                  </p>
                ))}
              </div>
            )}
            <div className='mt-10 text-right'>
              <p className='text-sm font-medium text-gray-700'>Client Signature</p>
              <div className='mt-2 border-b border-gray-400 w-48 ml-auto'></div>
            </div>
          </div>

          {/* Custom styles for Terms & Conditions HTML content */}
          <style>{`
            .tnc-content h1,
            .tnc-content h2,
            .tnc-content h3,
            .tnc-content h4 {
              font-weight: 700;
              color: #1a1a1a;
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
            }
            .tnc-content h1 { font-size: 1.25rem; }
            .tnc-content h2 { font-size: 1.125rem; }
            .tnc-content h3 { font-size: 1rem; }
            .tnc-content h4 { font-size: 0.925rem; }
            
            .tnc-content p {
              margin-top: 0.5rem;
              margin-bottom: 0.75rem;
              line-height: 1.7;
            }
            
            .tnc-content ul,
            .tnc-content ol {
              margin-top: 0.5rem;
              margin-bottom: 0.75rem;
              padding-left: 1.5rem;
            }
            
            .tnc-content ul {
              list-style-type: disc;
            }
            
            .tnc-content ol {
              list-style-type: decimal;
            }
            
            .tnc-content li {
              margin-top: 0.375rem;
              margin-bottom: 0.375rem;
              padding-left: 0.25rem;
              line-height: 1.6;
            }
            
            .tnc-content li p {
              margin: 0;
              display: inline;
            }
            
            .tnc-content strong,
            .tnc-content b {
              font-weight: 600;
            }
          `}</style>

          {/* Footer */}
          <div className='border-t pt-4 text-center text-sm text-gray-600'>
            <p className='font-semibold text-gray-800 mb-1'>{footerCompanyName}</p>
            <p className='mb-1'>{fullAddress}</p>
            {policy?.website && (
              <p className='mb-1'>
                <a
                  href={policy.website}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-600 hover:underline'
                >
                  {policy.website}
                </a>
              </p>
            )}
            {!policy && <p>Ph No. {FALLBACK_COMPANY_PHONE}</p>}
          </div>
        </div>
      )}
    </Container>
  );
}
