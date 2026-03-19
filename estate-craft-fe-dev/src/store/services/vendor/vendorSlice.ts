import { buildParams } from '../../../utils/helper';
import type { TAddVendorFormData } from '../../../validators/vendor';
import type { TBaseArgs } from '../../types/common.types';
import type { TCreateVendorRequest, TVendor } from '../../types/vendor.types';
import { api } from '../api';

export type TUpdateVendorRequest = Partial<TCreateVendorRequest> & { id: string };

// ---------- API ----------
export const vendorApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVendors: builder.query<
      { vendor: TVendor[]; totalCount?: number },
      TBaseArgs & { projectId?: string | null; status?: string | null }
    >({
      query: (args) => ({
        url: '/vendor',
        method: 'GET',
        params: buildParams(args),
      }),
      providesTags: (result) =>
        result?.vendor
          ? [
              ...result.vendor.map(({ id }) => ({ type: 'get_vendors' as const, id })), // tag each vendor
              { type: 'get_vendors', id: 'LIST' }, // tag the whole list
            ]
          : [{ type: 'get_vendors', id: 'LIST' }],
      transformResponse(res: { data: { vendor: TVendor[]; totalCount?: number } }) {
        return res.data;
      },
    }),
    createVendor: builder.mutation<void, TAddVendorFormData>({
      query: (body) => ({
        url: '/vendor',
        method: 'POST',
        // Also pass pincode at the top level for backend expectations
        body: {
          ...body,
          pincode: body.address?.pincode,
        },
      }),
      invalidatesTags: ['get_vendors'],
    }),

    updateVendor: builder.mutation<void, TAddVendorFormData & { id: string }>({
      query: ({ id, ...patch }) => ({
        url: `/vendor/${id}`,
        method: 'PUT',
        // Ensure pincode is passed alongside other fields
        body: {
          ...patch,
          pincode: patch.address?.pincode,
        },
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: 'get_vendors', id }],
    }),

    deleteVendor: builder.mutation<void, string>({
      query: (id) => ({
        url: `/vendor/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'get_vendors', id },
        { type: 'get_vendors', id: 'LIST' },
      ],
    }),
    updateVendorStatus: builder.mutation<void, { vendorId: string; status: 'ACTIVE' | 'INACTIVE' }>(
      {
        query: ({ vendorId, status }) => ({
          url: `/vendor/${vendorId}`,
          method: 'PUT',
          body: { status },
        }),
        invalidatesTags: (_res, _err, { vendorId }) => [
          { type: 'get_vendors', id: vendorId },
          { type: 'get_vendors', id: 'LIST' },
        ],
      },
    ),
  }),
  overrideExisting: false,
});

// ---------- Hooks ----------
export const {
  useGetVendorsQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
  useUpdateVendorStatusMutation,
  useLazyGetVendorsQuery,
} = vendorApi;
