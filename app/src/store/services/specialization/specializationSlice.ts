import { api } from '../api';

export interface Specialized {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface GetSpecializedResponse {
  specialized: Specialized[];
  totalCount: number;
}

export interface CreateSpecializedBody {
  name: string;
}

export interface CreateSpecializedResponse {
  specialized: Specialized;
}

export const specializedApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSpecialized: builder.query<GetSpecializedResponse, void>({
      query: () => '/vendor/specialized',
      transformResponse: (res: { data: GetSpecializedResponse; totalCount: number }) => res.data,
      providesTags: ['get_specializations'],
    }),
    createSpecialized: builder.mutation<CreateSpecializedResponse, CreateSpecializedBody>({
      query: (body) => ({
        url: '/vendor/specialized',
        method: 'POST',
        body,
      }),
      transformResponse: (res: { data: CreateSpecializedResponse }) => res.data,
      invalidatesTags: ['get_specializations'],
    }),
    updateSpecialized: builder.mutation<void, CreateSpecializedBody & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `/vendor/specialized/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_specializations'],
    }),
    deleteSpecialized: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/vendor/specialized/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (res: { data: { success: boolean } }) => res.data,
      invalidatesTags: ['get_specializations'],
    }),
  }),
});

export const {
  useGetSpecializedQuery,
  useCreateSpecializedMutation,
  useUpdateSpecializedMutation,
  useDeleteSpecializedMutation,
} = specializedApi;
