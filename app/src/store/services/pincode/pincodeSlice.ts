import { api } from '../api';

type TPincodeApiResponse = {
  data?: {
    id?: string;
    pincode?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
  };
};

export type TPincodeDetails = {
  id: string;
  pincode?: string;
  city: string;
  state: string;
  country?: string;
};

export const pincodeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPincodeDetails: builder.query<TPincodeDetails, { pincode: string }>({
      query: ({ pincode }) => ({
        url: '/pincode',
        method: 'GET',
        params: { pincode },
      }),
      transformResponse(res: TPincodeApiResponse): TPincodeDetails {
        const pin = res?.data || {};
        const city = pin.city || pin.district || '';
        return {
          id: pin.id || '',
          pincode: pin.pincode,
          city,
          state: pin.state || '',
          country: pin.country,
        };
      },
    }),
  }),
});

export const { useLazyGetPincodeDetailsQuery } = pincodeApi;
