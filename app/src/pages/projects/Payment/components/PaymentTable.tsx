import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Table, Checkbox } from '@mantine/core';
import { IconEye, IconDotsVertical } from '@tabler/icons-react';
import { ActionButton, Button, DeleteButton } from '../../../../components/base';
import FormSelect from '../../../../components/base/FormSelect';
import TableData from '../../../../components/base/table/TableData';
import TableWrapper from '../../../../components/base/table/TableWrapper';
import TableSearchBar from '../../../../components/common/TableSearchBar';
import ClearFilterButton from '../../../../components/base/button/ClearFilterButton';
import FormDate from '../../../../components/base/FormDate';
import useUrlSearchParams from '../../../../hooks/useUrlSearchParams';
import { prefixCurrencyInPrice } from '../../../../utils/helper';
import PaymentStatusBadge from './PaymentStatusBadge';
import {
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_TABS,
} from '../constants/constants';
import type { TPayment } from '../../../../types/payment.types';
import ResendInvoiceModal from './ResendInvoiceModal';
import { format } from 'date-fns';

interface PaymentTableProps {
  payments: TPayment[];
  isLoading?: boolean;
}

export default function PaymentTable({ payments, isLoading }: PaymentTableProps) {
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log('🔄 PaymentTable RENDER #', renderCount.current, {
    paymentsCount: payments.length,
    isLoading,
  });

  const { id } = useParams();
  const { getParam, deleteParams, setParams } = useUrlSearchParams();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [query, setQuery] = useState(() => getParam('search') || '');
  const [selectedPayment, setSelectedPayment] = useState<TPayment | null>(null);
  const [isResendModalOpened, setIsResendModalOpened] = useState(false);

  // Initialize dates from URL params only once
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const dateStr = getParam('startDate');
    if (dateStr) {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const dateStr = getParam('endDate');
    if (dateStr) {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  });

  const activeTab = getParam('tab') || PAYMENT_TABS.INBOX;

  // Use refs to track previous values and prevent unnecessary URL updates
  const prevStartDateRef = useRef<string | null>(null);
  const prevEndDateRef = useRef<string | null>(null);

  // Update URL params when dates change - only if they actually changed
  useEffect(() => {
    const startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : null;
    if (startDateStr !== prevStartDateRef.current) {
      console.log('📅 PaymentTable - StartDate changed:', {
        old: prevStartDateRef.current,
        new: startDateStr,
      });
      prevStartDateRef.current = startDateStr;
      if (startDateStr) {
        setParams('startDate', startDateStr);
      } else {
        deleteParams(['startDate']);
      }
    }
  }, [startDate, setParams, deleteParams]);

  useEffect(() => {
    const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : null;
    if (endDateStr !== prevEndDateRef.current) {
      console.log('📅 PaymentTable - EndDate changed:', {
        old: prevEndDateRef.current,
        new: endDateStr,
      });
      prevEndDateRef.current = endDateStr;
      if (endDateStr) {
        setParams('endDate', endDateStr);
      } else {
        deleteParams(['endDate']);
      }
    }
  }, [endDate, setParams, deleteParams]);

  const handleClearFilters = useCallback(() => {
    setQuery('');
    setStartDate(null);
    setEndDate(null);
    prevStartDateRef.current = null;
    prevEndDateRef.current = null;
    deleteParams(['search', 'status', 'method', 'paymentType', 'startDate', 'endDate']);
  }, [deleteParams, setQuery]);

  function handleResend(payment: TPayment) {
    setSelectedPayment(payment);
    setIsResendModalOpened(true);
  }

  function handleResendConfirm(recipientId: string) {
    console.log('Resending invoice to:', recipientId);
    setIsResendModalOpened(false);
  }

  // For now, show same data in both tabs (filtering will be done via API params later)
  const filteredPayments = payments;

  useEffect(() => {
    console.log('📋 PaymentTable - Filtered payments changed:', {
      count: filteredPayments.length,
      activeTab,
    });
  }, [filteredPayments.length, activeTab]);

  return (
    <div className='flex-1 flex flex-col min-h-0'>
      {/* SEARCH AND FILTERS SECTION */}
      <section className='flex gap-x-8 sm:flex-row flex-col lg:items-center justify-between mb-4'>
        <div className='flex lg:flex-row flex-col gap-5 w-full'>
          <TableSearchBar
            className='border rounded-lg shadow-sm'
            query={query}
            setQuery={setQuery}
            searchKey='search'
          />
          <FormSelect
            inputClassName='!rounded-lg !py-6 shadow-sm'
            placeholder='Status'
            data={PAYMENT_STATUS_OPTIONS}
            onChange={(val) => setParams('status', val)}
            value={getParam('status')}
            className='w-[12rem]'
          />
          <FormSelect
            inputClassName='!rounded-lg !py-6 shadow-sm'
            placeholder='Method'
            data={PAYMENT_METHOD_OPTIONS}
            onChange={(val) => setParams('method', val)}
            value={getParam('method')}
            className='w-[12rem]'
          />
          <div className='flex gap-2 w-[24rem]'>
            <FormDate
              placeholder='Start Date'
              value={startDate}
              onChange={(dateStr: string | null) => {
                if (dateStr) {
                  const date = new Date(dateStr);
                  setStartDate(isNaN(date.getTime()) ? null : date);
                } else {
                  setStartDate(null);
                }
              }}
              className='w-full'
              inputClassName='!rounded-lg !py-6 shadow-sm'
            />
            <FormDate
              placeholder='End Date'
              value={endDate}
              onChange={(dateStr: string | null) => {
                if (dateStr) {
                  const date = new Date(dateStr);
                  setEndDate(isNaN(date.getTime()) ? null : date);
                } else {
                  setEndDate(null);
                }
              }}
              className='w-full'
              inputClassName='!rounded-lg !py-6 shadow-sm'
              minDate={startDate || undefined}
            />
          </div>
          <ClearFilterButton className='border rounded-lg' onClick={handleClearFilters} />
        </div>
        <Link to={`/projects/${id}/payment/create`}>
          <Button radius='full' className='mt-4 text-sm! font-medium!'>
            Create Invoice
          </Button>
        </Link>
      </section>

      {/* TABLE SECTION */}
      <TableWrapper totalCount={filteredPayments.length} showPagination={false}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th className='w-14'>
              <Checkbox
                onClick={(e) => e.stopPropagation()}
                aria-label='Select row'
                checked={
                  selectedRows.length === filteredPayments.length && filteredPayments.length > 0
                }
                onChange={(event) =>
                  setSelectedRows(
                    event.target.checked ? filteredPayments.map((p) => p.id) || [] : [],
                  )
                }
              />
            </Table.Th>
            <Table.Th>Invoice ID</Table.Th>
            <Table.Th>To</Table.Th>
            <Table.Th>From</Table.Th>
            <Table.Th>Amount</Table.Th>
            <Table.Th>Date</Table.Th>
            <Table.Th>Status</Table.Th>
            {activeTab === PAYMENT_TABS.INBOX && (
              <>
                <Table.Th>Method</Table.Th>
                <Table.Th>Reference ID</Table.Th>
              </>
            )}
            <Table.Th>Action</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isLoading ? (
            <Table.Tr>
              <TableData colSpan={activeTab === PAYMENT_TABS.INBOX ? 10 : 8}>Loading...</TableData>
            </Table.Tr>
          ) : filteredPayments.length === 0 ? (
            <Table.Tr>
              <TableData colSpan={activeTab === PAYMENT_TABS.INBOX ? 10 : 8}>
                No payments found.
              </TableData>
            </Table.Tr>
          ) : (
            filteredPayments.map((payment) => (
              <Table.Tr key={payment.id}>
                <Table.Td>
                  <Checkbox
                    aria-label='Select row'
                    checked={selectedRows.includes(payment.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(event) =>
                      setSelectedRows((prev) =>
                        event.target.checked
                          ? [...prev, payment.id]
                          : prev.filter((row) => row !== payment.id),
                      )
                    }
                  />
                </Table.Td>
                <TableData>{payment.invoiceNumber}</TableData>
                <TableData>{payment.to}</TableData>
                <TableData>{payment.from}</TableData>
                <TableData>{prefixCurrencyInPrice(payment.amount, 'INR')}</TableData>
                <TableData>{format(new Date(payment.date), 'dd MMM yyyy')}</TableData>
                <Table.Td>
                  <PaymentStatusBadge status={payment.status} />
                </Table.Td>
                {activeTab === PAYMENT_TABS.INBOX && (
                  <>
                    <TableData>{payment.method}</TableData>
                    <TableData>{payment.referenceId}</TableData>
                  </>
                )}
                <Table.Td>
                  <div className='flex items-center space-x-2'>
                    <ActionButton tooltip='View' icon={<IconEye />} onClick={() => {}} />
                    {activeTab === PAYMENT_TABS.DRAFTS && (
                      <ActionButton
                        tooltip='Resend'
                        icon={<IconDotsVertical />}
                        onClick={() => handleResend(payment)}
                      />
                    )}
                    <DeleteButton tooltip='Delete payment' onDelete={() => {}} />
                  </div>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </TableWrapper>
      <ResendInvoiceModal
        opened={isResendModalOpened}
        onClose={() => setIsResendModalOpened(false)}
        onResend={handleResendConfirm}
        invoiceId={selectedPayment?.id}
      />
    </div>
  );
}
