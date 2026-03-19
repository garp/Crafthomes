// src/redux/services/productBrandApi.ts
import type { TBaseArgs } from '../../types/common.types';
import type { TProductBrand } from '../../types/productBrand.types';
import { api } from '../api';

// ---------- TYPES ----------

export type TCreateProductBrandBody = {
  name: string;
};

// ---------- API ----------
export const productBrandApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // CREATE
    createProductBrand: builder.mutation<void, TCreateProductBrandBody>({
      query: (body) => ({
        url: '/category/brand',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_product_brand'],
    }),

    // UPDATE
    editProductBrand: builder.mutation<void, { id: string } & TCreateProductBrandBody>({
      query: ({ id, ...body }) => ({
        url: `/category/brand/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_product_brand'],
    }),

    // READ (GET ALL)
    getProductBrands: builder.query<
      { brands: TProductBrand[]; totalCount: number },
      TBaseArgs & { id?: string; search?: string }
    >({
      query: (arg) => {
        const params: Record<string, string | number | undefined> = {};
        if (arg?.pageNo) params.pageNo = arg.pageNo;
        if (arg?.pageLimit) params.pageLimit = arg.pageLimit;
        if (arg?.search) params.search = arg.search;
        if (arg?.id) params.id = arg.id;

        return {
          url: '/category/brand',
          method: 'GET',
          params,
        };
      },
      transformResponse(res: { data: { brands: TProductBrand[]; totalCount: number } }) {
        return res.data;
      },
      providesTags: ['get_product_brand'],
    }),

    // DELETE
    deleteProductBrand: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/category/brand/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_product_brand'],
    }),
  }),
});

// ---------- EXPORT HOOKS ----------
export const {
  useCreateProductBrandMutation,
  useEditProductBrandMutation,
  useGetProductBrandsQuery,
  useDeleteProductBrandMutation,
  useLazyGetProductBrandsQuery,
} = productBrandApi;
