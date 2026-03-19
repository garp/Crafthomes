import { Link, useNavigate, useParams } from 'react-router-dom';
import { ActionButton, Button, DeleteButton } from '../../../../components';
import Container from '../../../../components/common/Container';
import { Table, Checkbox, Modal } from '@mantine/core';
import { QUOTATION_STATUS_OPTIONS, TYPE_OPTIONS } from '../constants/constants';
import { useState } from 'react';
import TableData from '../../../../components/base/table/TableData';
import StatusBadge from '../../../../components/common/StatusBadge';
import { IconEye } from '@tabler/icons-react';
import { EditIcon } from '../../../../components/icons';
import {
  useDeleteProjectQuotationMutation,
  useGetProjectQuotationsQuery,
  useUpdateProjectQuotationMutation,
} from '../../../../store/services/projectQuotation/projectQuotationSlice';
import { format } from 'date-fns';
import useUrlSearchParams from '../../../../hooks/useUrlSearchParams';
import AlertModal from '../../../../components/base/AlertModal';
import { useDisclosure } from '@mantine/hooks';
import { type TQuotation } from '../../../../store/types/projectQuotation.types';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../../../store/types/common.types';
import TableLoader from '../../../../components/common/loaders/TableLoader';
import TableSearchBar from '../../../../components/common/TableSearchBar';
import ClearFilterButton from '../../../../components/base/button/ClearFilterButton';
import StatusFilter from '../../../../components/common/selectors/StatusSelector';
import FormSelect from '../../../../components/base/FormSelect';
import TableWrapper from '../../../../components/base/table/TableWrapper';
import { prefixCurrencyInPrice } from '../../../../utils/helper';

// //////////////////CREATE QUOTATION SECTION
// function CreateQuotation() {
//   const { id } = useParams();
//   return (
//     <Container className='h-full'>
//       <h6 className='font-bold text-sm'>QUOTATION</h6>
//       <hr className='border border-gray-200 mt-2' />
//       <div className=' h-full w-full flex flex-col  items-center justify-center'>
//         <p className=' font-bold text-lg'>Get Started with Quotation</p>
//         <p className='mt-2 text-text-subHeading max-w-[23rem] text-center'>
//           It looks like you don’t have any quotation yet. Let’s create your first folder to get
//           started!
//         </p>
//         <Link to={`/projects/${id}/quotation/add`}>
//           <Button radius='full' className='mt-4 !text-sm !font-medium'>
//             Create Quote
//           </Button>
//         </Link>
//       </div>
//     </Container>
//   );
// }

/////////QUOTATION TABLE SECTION
export default function QuotationTable() {
  const { getParam, deleteParams, setParams } = useUrlSearchParams();
  const { id } = useParams();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  // Build query params - only include optional params if they have values
  const queryParams: any = {
    pageLimit: '10',
    pageNo: getParam('page'),
    search: getParam('query'),
    searchText: getParam('globalQuery'),
    projectId: id,
  };

  const typeParam = getParam('type');
  if (typeParam) {
    queryParams.type = typeParam;
  }

  const statusParam = getParam('status');
  if (statusParam) {
    queryParams.quotationStatus = statusParam;
  }

  const { data: quotationData, isFetching: isFetchingQuotations } =
    useGetProjectQuotationsQuery(queryParams);
  const [deleteQuotation, { isLoading: isDeletingQuotation }] = useDeleteProjectQuotationMutation();
  const [updateQuotation, { isLoading: isUpdatingQuotation }] = useUpdateProjectQuotationMutation();
  const [isOpenDeleteModal, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [isOpenStatusModal, { open: openStatusModal, close: closeStatusModal }] =
    useDisclosure(false);

  const [selectedQuotation, setSelectedQuotation] = useState<TQuotation | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');

  function handleDelete() {
    deleteQuotation(selectedQuotation?.id || '')
      .unwrap()
      .then(() => {
        toast.success('Quotation deleted successfully');
        closeDeleteModal();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Internal server error');
        console.log('Error in deleting quotation:', error);
      });
  }

  function handleUpdateStatus() {
    if (!selectedQuotation || !newStatus) {
      toast.error('Please select a status');
      return;
    }

    // Get items from quotationItem (API response) or items (legacy)
    const quotationItems =
      (selectedQuotation as any).quotationItem || selectedQuotation.items || [];

    // Map items to the correct format
    const mappedItems = quotationItems.map((item: any) => ({
      masterItemId: item.masterItem?.id || item.masterItemId || item.id,
      quantity: item.quantity || 1,
      discount: item.discount || 0,
      total: item.total || 0,
    }));

    // Create the update payload with all required fields
    const updatePayload = {
      id: selectedQuotation.id,
      projectId: id || '',
      name: selectedQuotation.name || '',
      description: selectedQuotation.description || '',
      clientId: selectedQuotation.client.id,
      quotationStatus: newStatus as 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'DRAFT',
      discount: selectedQuotation.discount || 0,
      paidAmount: selectedQuotation.paidAmount || 0,
      totalAmount: selectedQuotation.totalAmount || 0,
      items: mappedItems,
    };

    updateQuotation(updatePayload)
      .unwrap()
      .then(() => {
        toast.success('Quotation status updated successfully');
        closeStatusModal();
        setNewStatus('');
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error('Unable to update quotation status');
        }
        console.log('Error in updating quotation status:', error);
      });
  }
  // const totalPages = Math.ceil((quotationData?.totalCount || 1) / 10);
  const navigate = useNavigate();
  function handleClearFilters() {
    deleteParams(['query', 'status', 'type']);
    setQuery('');
  }
  return (
    <>
      <Container className='gap-5  h-full'>
        <h6 className='font-bold text-sm'>QUOTATION</h6>
        {/* FILTERS SECTION */}

        <section className='flex gap-x-8 sm:flex-row flex-col  lg:items-center justify-between'>
          <div className='flex lg:flex-row flex-col gap-5 w-1/2'>
            <TableSearchBar
              className='border rounded-lg shadow-sm'
              query={query}
              setQuery={setQuery}
            />
            {/* <SelectBox
              placeholder='Progress'
              option={[{ label: 'progress1', value: 'progress1' }]}
            /> */}
            <FormSelect
              inputClassName='!rounded-lg !py-6 shadow-sm'
              placeholder='Select type'
              data={TYPE_OPTIONS}
              onChange={(val) => setParams('type', val)}
              value={getParam('type')}
              className='w-[20rem]'
            />
            <StatusFilter
              className='border rounded-lg shadow-sm'
              options={QUOTATION_STATUS_OPTIONS}
            />
            <ClearFilterButton className='border rounded-lg' onClick={handleClearFilters} />
          </div>
          <Link to={`/projects/${id}/quotation/add`}>
            <Button radius='full' className='mt-4 text-sm! font-medium!'>
              Create Quote
            </Button>
          </Link>
        </section>

        {/* TABLE SECTION */}
        <TableWrapper totalCount={quotationData?.totalCount}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th className=' w-14'>
                <Checkbox
                  onClick={(e) => e.stopPropagation()}
                  aria-label='Select row'
                  checked={selectedRows.length === quotationData?.quotations?.length}
                  onChange={(event) =>
                    setSelectedRows(
                      event.target.checked ? quotationData?.quotations?.map((q) => q.id) || [] : [],
                    )
                  }
                />
              </Table.Th>
              <Table.Th>Quote ID</Table.Th>
              <Table.Th>Quotation Name</Table.Th>
              <Table.Th>Customer</Table.Th>
              <Table.Th>Created Date</Table.Th>
              <Table.Th>Total Amount</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          {/* TABLE BODY */}
          <Table.Tbody>
            {isFetchingQuotations ? (
              <TableLoader />
            ) : (
              quotationData?.quotations?.map((quotation) => (
                <Table.Tr
                  className='cursor-pointer'
                  onClick={() => navigate(`/projects/${id}/quotation/view/${quotation?.id}`)}
                  key={quotation?.id}
                  bg={selectedRows?.includes(quotation?.id) ? 'var(--color-gray-100)' : undefined}
                >
                  <Table.Td className='flex items-center gap-2'>
                    <Checkbox
                      aria-label='Select row'
                      checked={selectedRows.includes(quotation?.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(event) =>
                        setSelectedRows((prev) =>
                          event.target.checked
                            ? [...prev, quotation?.id]
                            : prev.filter((row) => row !== quotation?.id),
                        )
                      }
                    />
                    {/* <IconButton>
                      <StarIcon className='text-orange-500 size-4' />
                    </IconButton> */}
                  </Table.Td>
                  <TableData>{quotation?.quoteId || quotation?.sNo}</TableData>
                  <TableData>{quotation?.name}</TableData>
                  <TableData>{quotation?.client?.name}</TableData>
                  <TableData>
                    {quotation?.createdAt && format(quotation?.createdAt, 'dd MMM yyyy')}
                  </TableData>
                  <TableData>
                    {prefixCurrencyInPrice(quotation?.totalAmount || 0, 'INR', true)}
                  </TableData>
                  <Table.Td>
                    <StatusBadge status={quotation?.quotationStatus || ''} />
                  </Table.Td>
                  <Table.Td>
                    <div className='flex items-center space-x-2'>
                      <ActionButton
                        tooltip='View'
                        icon={<IconEye />}
                        onClick={() => {
                          navigate(`/projects/${id}/quotation/view/${quotation?.id}`);
                        }}
                      />
                      <ActionButton
                        tooltip='Update Status'
                        variant='edit'
                        icon={<EditIcon />}
                        onClick={() => {
                          setSelectedQuotation(quotation);
                          setNewStatus(quotation.quotationStatus || '');
                          openStatusModal();
                        }}
                      />
                      <DeleteButton
                        tooltip='Delete quotation'
                        disabled={quotation.quotationStatus === 'COMPLETED'}
                        onDelete={() => {
                          if (quotation.quotationStatus === 'COMPLETED') return;
                          setSelectedQuotation(quotation);
                          openDeleteModal();
                        }}
                      />
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </TableWrapper>
        {/* <CustomPagination total={totalPages} /> */}
      </Container>
      <AlertModal
        isLoading={isDeletingQuotation}
        opened={isOpenDeleteModal}
        onClose={closeDeleteModal}
        title={`Delete ${selectedQuotation?.sNo}?`}
        onConfirm={handleDelete}
      />

      {/* Update Status Modal */}
      <Modal
        opened={isOpenStatusModal}
        onClose={closeStatusModal}
        title={`Update Quotation Status - ${selectedQuotation?.sNo}`}
        centered
        size='md'
      >
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Select New Status
            </label>
            <FormSelect
              placeholder='Select Status'
              data={QUOTATION_STATUS_OPTIONS}
              value={newStatus}
              onChange={(value) => setNewStatus(value || '')}
              required
            />
          </div>

          <div className='flex justify-end gap-3 mt-6'>
            <Button
              variant='outline'
              onClick={closeStatusModal}
              disabled={isUpdatingQuotation}
              radius='md'
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={!newStatus || isUpdatingQuotation}
              radius='md'
            >
              {isUpdatingQuotation ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
