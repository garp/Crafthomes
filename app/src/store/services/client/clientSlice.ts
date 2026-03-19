import { buildParams } from '../../../utils/helper';
import type {
  TGetClientsApiResponse,
  TClient,
  TGetClientArgs,
  TCreateClientBody,
  TEditClientBody,
} from '../../types/client.types';
import type { TStats } from '../../types/common.types';
import { api } from '../api';

export const clientApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getClients: builder.query<
      { clients: TClient[]; totalCount: number; stats: TStats },
      TGetClientArgs
    >({
      query: (arg) => {
        return {
          url: '/client',
          method: 'GET',
          params: buildParams(arg),
        };
      },
      providesTags: ['get_clients'],
      transformResponse(res: TGetClientsApiResponse) {
        const raw = res?.data;
        return {
          totalCount: raw?.totalCount || 0,
          stats: raw?.stats as TStats,
          clients:
            raw?.clients?.map((client: any) => {
              const projects =
                client.Project?.map((p: any) => ({
                  id: p.id,
                  name: p.name,
                })) || [];

              return {
                id: client.id,
                name: client.name,
                email: client.email,
                location: client.location,
                phoneNumber: client.phoneNumber,
                status: client.status,
                sNo: client.sNo,
                clientType: client.clientType,
                gstIn: client.gstIn,
                panDetails: client.panDetails,
                startDate: client.startDate,
                projects,
                projectName: projects[0]?.name ?? null,
                addresses:
                  client.Address?.map((addr: any) => ({
                    id: addr.id,
                    label: addr.label,
                    building: addr.building,
                    street: addr.street,
                    locality: addr.locality,
                    city: addr.city,
                    state: addr.state,
                    landmark: addr.landmark,
                    pincode: addr.pincode?.pincode ?? addr.pincodeCode ?? null,
                    country: addr.country,
                  })) || [],
                teamMembers:
                  client.teamMembers?.map((member: any) => ({
                    id: member.id,
                    name: member.name,
                    email: member.email,
                  })) || [],
                paymentProgress: client.paymentProgress,
              } satisfies TClient;
            }) || [],
        };
      },
    }),

    createClient: builder.mutation<void, TCreateClientBody>({
      query: (body) => ({
        url: '/client',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_clients'],
    }),
    editClient: builder.mutation<void, TEditClientBody>({
      query: ({ clientId, ...body }) => ({
        url: `/client/${clientId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_clients'],
    }),
    deleteClient: builder.mutation<void, { clientId: string }>({
      query: (arg) => ({
        url: `/client/${arg?.clientId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_clients'],
    }),
    deleteClientAddress: builder.mutation<void, { addressId: string }>({
      query: ({ addressId }) => ({
        url: `/client/address/${addressId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_clients'],
    }),
    updateClientStatus: builder.mutation<void, { clientId: string; status: 'ACTIVE' | 'INACTIVE' }>(
      {
        query: ({ clientId, status }) => ({
          url: `/client/${clientId}`,
          method: 'PUT',
          body: { status },
        }),
        invalidatesTags: ['get_clients'],
      },
    ),
  }),
});

export const {
  useGetClientsQuery,
  useCreateClientMutation,
  useEditClientMutation,
  useDeleteClientMutation,
  useUpdateClientStatusMutation,
  useLazyGetClientsQuery,
  useDeleteClientAddressMutation,
} = clientApi;
