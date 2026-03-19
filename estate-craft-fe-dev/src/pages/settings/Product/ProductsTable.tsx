'use client';

import { Table } from '@mantine/core';
import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';

import {
  useDeleteProductMutation,
  useGetProductsQuery,
} from '../../../store/services/product/productSlice';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import TableWrapper from '../../../components/base/table/TableWrapper';
import TableData from '../../../components/base/table/TableData';
import { TextHeader } from '../../../components/base/table/TableHeader';
import TableLoader from '../../../components/common/loaders/TableLoader';
import NotFoundTextTable from '../../../components/common/NotFound';
import AlertModal from '../../../components/base/AlertModal';
import type { TProduct } from '../../../store/types/product.types';
// import type { TErrorResponse } from '../../../store/types/common.types';
import { DeleteButton, EditButton, Image } from '../../../components';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../../store/types/common.types';
import EditProductSidebar from '../../../components/product/EditProductSidebar';
import { prefixCurrencyInPrice } from '../../../utils/helper';

export default function ProductTable() {
  const { getParam } = useUrlSearchParams();
  const page = getParam('page') || '0';
  const {
    data: productsData,
    isFetching,
    isError,
  } = useGetProductsQuery({
    pageNo: page,
    pageLimit: '10',
    search: getParam('query') || '',
    searchText: getParam('globalQuery') || '',
    categoryId: getParam('categoryId') || '',
    subCategoryId: getParam('subCategoryId') || '',
    brandId: getParam('brandId') || '',
  });
  const [triggerDeleteProduct, { isLoading: isDeletingProduct }] = useDeleteProductMutation();
  const [selectedProduct, setSelectedProduct] = useState<TProduct | null>(null);
  const [isOpenDeleteProduct, { open: openDeleteProduct, close: closeDeleteProduct }] =
    useDisclosure(false);
  const [
    isOpenEditProductSidebar,
    { open: openEditProductSidebar, close: closeEditProductSidebar },
  ] = useDisclosure(false);
  function handleDeleteClick(product: TProduct) {
    setSelectedProduct(product);
    openDeleteProduct();
  }
  function handleDeleteProduct() {
    if (!selectedProduct?.id) return;
    triggerDeleteProduct({ id: selectedProduct?.id })
      .then(() => {
        closeDeleteProduct();
        toast.success('Product deleted successfully');
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) toast.error(error?.data?.message);
        else toast.error('Internal server error');
        console.error('Error creating Product:', error);
      });
  }
  function handleEditClick(product: TProduct) {
    setSelectedProduct(product);
    openEditProductSidebar();
  }
  return (
    <>
      <TableWrapper totalCount={productsData?.totalCount}>
        <Table.Thead>
          <Table.Tr className='h-12'>
            <TextHeader config='srNo'>S. No.</TextHeader>
            <TextHeader config='srNo'>Product Name</TextHeader>
            <TextHeader config='checkbox'>Image</TextHeader>
            <TextHeader>Description</TextHeader>
            <TextHeader>M.R.P</TextHeader>
            <TextHeader config='action' isSticky={{ position: 'right' }}>
              Actions
            </TextHeader>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {isFetching || isError ? (
            <TableLoader />
          ) : productsData?.masterItems?.length === 0 ? (
            <NotFoundTextTable title='No Products Found' />
          ) : (
            productsData?.masterItems?.map((product) => (
              <Table.Tr
                key={product.id}
                onClick={() => handleEditClick(product)}
                className='group border-b border-gray-200 bg-white hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-in-out cursor-pointer'
              >
                {/* SNO */}
                <TableData>{product?.sNo}</TableData>
                {/* PRODUCT NAME */}
                <TableData>{product?.name}</TableData>
                {/* IMAGE */}
                <TableData>
                  {product?.primaryFile?.[0]?.url ? (
                    <Image
                      src={product.primaryFile[0].url}
                      alt={product?.name || 'Product image'}
                      width={40}
                      height={40}
                      objectFit='cover'
                      className='rounded-md w-10 h-10'
                      loaderWrapperClassName='w-10 h-10 rounded-md'
                    />
                  ) : (
                    <div className='w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center'>
                      <svg
                        className='w-6 h-6 text-gray-400'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                        />
                      </svg>
                    </div>
                  )}
                </TableData>
                {/* DESC */}
                <TableData className='line-clamp-3'>{product?.description}</TableData>
                {/* DESC */}
                <TableData>{prefixCurrencyInPrice(product?.mrp, product?.currency)}</TableData>
                {/* ACTIONS */}
                <Table.Td
                  className='group-hover:bg-slate-100 bg-white'
                  style={{
                    position: 'sticky',
                    right: '0px',
                    zIndex: 5,
                    width: '120px',
                    minWidth: '120px',
                  }}
                >
                  <div className='flex gap-2'>
                    <EditButton onEdit={() => handleEditClick(product)} />
                    <DeleteButton onDelete={() => handleDeleteClick(product)} />
                  </div>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </TableWrapper>

      {/* ADD STOCK MODAL */}
      <AlertModal
        isLoading={isDeletingProduct}
        title={`Delete ${selectedProduct?.name}?`}
        opened={isOpenDeleteProduct}
        onClose={closeDeleteProduct}
        onConfirm={handleDeleteProduct}
      />
      <EditProductSidebar
        productData={selectedProduct}
        isOpen={isOpenEditProductSidebar}
        onClose={closeEditProductSidebar}
      />
    </>
  );
}
