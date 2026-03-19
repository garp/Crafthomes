import type { TCreateProductCategoryFormData } from '../../../validators/productCategory.validator';
import type { TBaseArgs } from '../../types/common.types';
import type { TProductCategory } from '../../types/productCategory.types';
import { api } from '../api';

export type TCreateCategoryBody = {
  name: string;
  description: string;
};

export const productCategoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // CREATE
    createProductCategory: builder.mutation<
      { data: { id: string; name: string } },
      TCreateProductCategoryFormData
    >({
      query: (body) => ({
        url: '/category',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_product_categories'],
    }),

    // UPDATE
    editProductCategory: builder.mutation<void, { id: string } & TCreateProductCategoryFormData>({
      query: ({ id, ...body }) => ({
        url: `/category/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_product_categories'],
    }),

    // READ (GET ALL)
    getProductCategories: builder.query<
      { categories: TProductCategory[]; totalCount: number },
      TBaseArgs & { id?: string | null }
    >({
      query: (arg) => {
        const params: Record<string, string | number | undefined> = {};
        if (arg?.pageNo) params.pageNo = arg.pageNo;
        if (arg?.pageLimit) params.pageLimit = arg.pageLimit;
        if (arg?.search) params.search = arg.search;
        if (arg?.id) params.id = arg.id;

        return {
          url: '/category',
          method: 'GET',
          params,
        };
      },
      transformResponse(res: { data: { categories: TProductCategory[]; totalCount: number } }) {
        return res.data;
      },
      providesTags: ['get_product_categories'],
    }),

    // DELETE
    deleteProductCategory: builder.mutation<void, { id: string }>({
      query: (arg) => ({
        url: `/category/${arg.id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_product_categories'],
    }),
  }),
});

export const {
  useGetProductCategoriesQuery,
  useLazyGetProductCategoriesQuery,
  useCreateProductCategoryMutation,
  useEditProductCategoryMutation,
  useDeleteProductCategoryMutation,
} = productCategoryApi;
