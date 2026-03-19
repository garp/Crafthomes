import { api } from '../api';
import { buildParams } from '../../../utils/helper';
import type { TBaseArgs } from '../../types/common.types';

export interface TCreateInvoiceBody {
  projectId: string;
  clientId: string;
  dueDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subTotalAmount: number;
  discount: number;
  tax: number;
  totalAmount: number;
}

export interface TCreateInvoiceResponse {
  id: string;
  invoiceNumber: string;
  // Add other response fields as needed
}

export interface TPaymentItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface TPaymentApiResponse {
  id: string;
  sNo: number;
  project: {
    id: string;
    name: string;
  };
  client: {
    id: string;
    name: string;
  };
  paymentType: string;
  paymentStatus: string;
  paymentDate: string | null;
  referenceId: string | null;
  paymentMethod: string;
  otherPaymentMethod: string | null;
  subTotalAmount: number;
  discount: number;
  tax: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  paymentItems: TPaymentItem[];
  createdByUser: {
    id: string;
    name: string;
    email: string;
  };
  updatedByUser: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface TGetPaymentsResponse {
  payments: TPaymentApiResponse[];
  totalCount: number;
}

export interface TGetPaymentsArgs extends TBaseArgs {
  projectId: string;
  search?: string;
  paymentMethod?: string;
  paymentType?: string;
  startDate?: string;
  endDate?: string;
}

export const paymentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createInvoice: builder.mutation<TCreateInvoiceResponse, TCreateInvoiceBody>({
      query: (body) => ({
        url: '/payment',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_payments'],
    }),
    getPayments: builder.query<TGetPaymentsResponse, TGetPaymentsArgs>({
      query: (arg) => {
        return {
          url: '/payment',
          method: 'GET',
          params: buildParams(arg),
        };
      },
      transformResponse: (res: { data: TGetPaymentsResponse }) => {
        return res.data;
      },
      providesTags: ['get_payments'],
    }),
  }),
});

export const { useCreateInvoiceMutation, useGetPaymentsQuery } = paymentApi;
