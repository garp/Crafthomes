import type { TBaseArgs } from '../../types/common.types';
import type { TPolicy, TPolicyResponse, TCreatePolicyBody } from '../../types/policy.types';
import { api } from '../api';
import { buildParams } from '../../../utils/helper';

export const policyApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ GET policies (with pagination)
    getPolicies: builder.query<TPolicyResponse, TBaseArgs>({
      query: (arg) => {
        return {
          url: '/settings/policy',
          method: 'GET',
          params: buildParams(arg),
        };
      },
      transformResponse(res: { data: TPolicyResponse }) {
        return res?.data;
      },
      providesTags: ['get_policies'],
    }),

    // ✅ GET single policy by id
    getPolicyById: builder.query<TPolicy, { id: string }>({
      query: ({ id }) => ({
        url: `/settings/policy/${id}`,
        method: 'GET',
      }),
      transformResponse(res: { data: TPolicy }) {
        return res?.data;
      },
      providesTags: ['get_policies'],
    }),

    // ✅ POST (create new policy)
    createPolicy: builder.mutation<TPolicy, TCreatePolicyBody>({
      query: (body) => ({
        url: '/settings/policy',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_policies'],
    }),

    // ✅ PUT (update policy by id)
    updatePolicy: builder.mutation<TPolicy, { id: string } & Partial<TCreatePolicyBody>>({
      query: ({ id, ...body }) => ({
        url: `/settings/policy/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_policies'],
    }),

    // ✅ DELETE (delete policy by id)
    deletePolicy: builder.mutation<{ success: boolean }, { id: string }>({
      query: ({ id }) => ({
        url: `/settings/policy/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_policies'],
    }),
  }),
});

export const {
  useGetPoliciesQuery,
  useGetPolicyByIdQuery,
  useLazyGetPoliciesQuery,
  useLazyGetPolicyByIdQuery,
  useCreatePolicyMutation,
  useUpdatePolicyMutation,
  useDeletePolicyMutation,
} = policyApi;
