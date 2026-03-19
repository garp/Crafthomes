// src/redux/services/productApi.ts
import { buildParams } from '../../../utils/helper';
import type { TCreateProductFormData } from '../../../validators/product.validator';
import type { TBaseArgs } from '../../types/common.types';
import type { TProduct } from '../../types/product.types';
import { api } from '../api';

export const productApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // CREATE
    createProduct: builder.mutation<void, TCreateProductFormData>({
      query: (body) => ({
        url: '/masterItem',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_product'],
    }),

    // UPDATE
    editProduct: builder.mutation<void, { id: string } & TCreateProductFormData>({
      query: ({ id, ...body }) => ({
        url: `/masterItem/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_product'],
    }),

    // READ (GET ALL)
    getProducts: builder.query<
      { masterItems: TProduct[]; totalCount: number },
      TBaseArgs & {
        id?: string;
        categoryId?: string;
        subCategoryId?: string;
        vendorId?: string;
        brandId?: string;
      }
    >({
      query: (arg) => {
        return {
          url: '/masterItem',
          method: 'GET',
          params: buildParams(arg),
        };
      },
      transformResponse(res: { data: { masterItems: TProduct[]; totalCount: number } }) {
        return res.data;
      },
      providesTags: ['get_product'],
    }),

    // DELETE
    deleteProduct: builder.mutation<void, { id: string }>({
      query: (arg) => ({
        url: `/masterItem/${arg.id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_product'],
    }),
  }),
});

export const {
  useCreateProductMutation,
  useEditProductMutation,
  useGetProductsQuery,
  useDeleteProductMutation,
  useLazyGetProductsQuery,
} = productApi;
