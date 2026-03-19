import type { TCreateProductSubCategoryFormData } from '../../../validators/productSubCategory.validator';
import type { TBaseArgs } from '../../types/common.types';
import type { TProductSubCategory } from '../../types/productSubCategory.types';
import { api } from '../api';

export const productSubCategoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // CREATE
    createProductSubCategory: builder.mutation<
      { data: { id: string; name: string } },
      TCreateProductSubCategoryFormData
    >({
      query: (body) => ({
        url: '/category/sub',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_product_sub_categories'],
    }),

    // UPDATE
    editProductSubCategory: builder.mutation<
      void,
      { id: string } & TCreateProductSubCategoryFormData
    >({
      query: ({ id, ...body }) => ({
        url: `/category/sub/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_product_sub_categories'],
    }),

    // READ (GET ALL)
    getProductSubCategory: builder.query<
      { subCategories: TProductSubCategory[]; totalCount: number },
      TBaseArgs & { id?: string | null; categoryId?: string }
    >({
      query: (arg) => {
        const params: Record<string, string | number | undefined> = {};
        if (arg?.pageNo) params.pageNo = arg.pageNo;
        if (arg?.pageLimit) params.pageLimit = arg.pageLimit;
        if (arg?.search) params.search = arg.search;
        if (arg?.id) params.id = arg.id;
        if (arg?.categoryId) params.categoryId = arg.categoryId;

        return {
          url: '/category/sub',
          method: 'GET',
          params,
        };
      },
      transformResponse(res: {
        data: { subCategories: TProductSubCategory[]; totalCount: number };
      }) {
        return res.data;
      },
      providesTags: ['get_product_sub_categories'],
    }),

    // DELETE
    deleteProductSubCategory: builder.mutation<void, { id: string }>({
      query: (arg) => ({
        url: `/category/sub/${arg.id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_product_sub_categories'],
    }),
  }),
});

export const {
  useGetProductSubCategoryQuery,
  useCreateProductSubCategoryMutation,
  useDeleteProductSubCategoryMutation,
  useEditProductSubCategoryMutation,
  useLazyGetProductSubCategoryQuery,
} = productSubCategoryApi;
