import { buildParams } from '../../../utils/helper';
import type {
  TCreateSiteVisitBody,
  TGetSiteVisitsArgs,
  TGetSiteVisitsResponse,
  TSiteVisit,
  TUpdateSiteVisitBody,
  TGalleryCollection,
  TGalleryAttachment,
  TGalleryAttachmentApiResponse,
  TGalleryAttachmentsListApiResponse,
  TCreateGalleryCollectionBody,
  TUpdateGalleryCollectionBody,
  TCreateGalleryAttachmentBody,
  TUpdateGalleryAttachmentBody,
} from '../../types/siteVisit.types';
import { api } from '../api';

const GALLERY_TAG = 'site_visit_gallery' as const;

export const siteVisitApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProjectSiteVisits: builder.query<
      { siteVisits: TSiteVisit[]; totalCount: number },
      TGetSiteVisitsArgs
    >({
      query: (arg) => ({
        url: '/site-visit',
        params: buildParams(arg),
      }),
      transformResponse(res: TGetSiteVisitsResponse) {
        return res?.data ?? { siteVisits: [], totalCount: 0 };
      },
      providesTags: (result, _err, arg) =>
        result
          ? [
              ...result.siteVisits.map(({ id }) => ({
                type: 'get_project_site_visits' as const,
                id,
              })),
              { type: 'get_project_site_visits', id: `LIST-${arg.projectId}` },
            ]
          : [{ type: 'get_project_site_visits', id: `LIST-${arg.projectId}` }],
    }),

    getSiteVisitById: builder.query<TSiteVisit, string>({
      query: (id) => ({ url: `/site-visit/${id}` }),
      transformResponse(res: { data: TSiteVisit }) {
        return res?.data;
      },
      providesTags: (_result, _err, id) => [{ type: 'get_project_site_visits', id }],
    }),

    createSiteVisit: builder.mutation<{ data: TSiteVisit }, TCreateSiteVisitBody>({
      query: (body) => ({
        url: '/site-visit',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _err, body) => [
        { type: 'get_project_site_visits', id: `LIST-${body.projectId}` },
      ],
    }),

    updateSiteVisit: builder.mutation<{ data: TSiteVisit }, TUpdateSiteVisitBody & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `/site-visit/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_project_site_visits'],
    }),

    deleteSiteVisit: builder.mutation<void, { id: string; projectId: string }>({
      query: ({ id }) => ({
        url: `/site-visit/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, { projectId }) => [
        { type: 'get_project_site_visits', id: `LIST-${projectId}` },
      ],
    }),

    // Gallery collections
    getGalleryCollections: builder.query<TGalleryCollection[], string>({
      query: (siteVisitId) => ({
        url: '/site-visit/gallery-collections',
        params: { siteVisitId },
      }),
      transformResponse(res: { data: TGalleryCollection[] }) {
        return res?.data ?? [];
      },
      providesTags: (_result, _err, siteVisitId) => [
        { type: GALLERY_TAG, id: `COLLECTIONS-${siteVisitId}` },
      ],
    }),

    getGalleryCollectionById: builder.query<TGalleryCollection, string>({
      query: (id) => ({ url: `/site-visit/gallery-collections/${id}` }),
      transformResponse(res: { data: TGalleryCollection }) {
        return res?.data;
      },
      providesTags: (_result, _err, id) => [{ type: GALLERY_TAG, id: `COLLECTION-${id}` }],
    }),

    createGalleryCollection: builder.mutation<
      { data: TGalleryCollection },
      TCreateGalleryCollectionBody
    >({
      query: (body) => ({
        url: '/site-visit/gallery-collections',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _err, body) => [
        { type: GALLERY_TAG, id: `COLLECTIONS-${body.siteVisitId}` },
      ],
    }),

    updateGalleryCollection: builder.mutation<
      { data: TGalleryCollection },
      TUpdateGalleryCollectionBody & { id: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/site-visit/gallery-collections/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['site_visit_gallery'],
    }),

    deleteGalleryCollection: builder.mutation<void, { id: string; siteVisitId: string }>({
      query: ({ id }) => ({
        url: `/site-visit/gallery-collections/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, { siteVisitId }) => [
        { type: GALLERY_TAG, id: `COLLECTIONS-${siteVisitId}` },
      ],
    }),

    // Gallery attachments
    getGalleryAttachments: builder.query<TGalleryAttachment[], string>({
      query: (siteVisitGalleryCollectionId) => ({
        url: '/site-visit/gallery-attachments',
        params: { siteVisitGalleryCollectionId },
      }),
      transformResponse(res: TGalleryAttachmentsListApiResponse) {
        return res?.data ?? [];
      },
      providesTags: (_result, _err, collectionId) => [
        { type: GALLERY_TAG, id: `ATTACHMENTS-${collectionId}` },
      ],
    }),

    getGalleryAttachmentById: builder.query<TGalleryAttachment, string>({
      query: (id) => ({ url: `/site-visit/gallery-attachments/${id}` }),
      transformResponse(res: TGalleryAttachmentApiResponse) {
        return res?.data;
      },
      providesTags: ['site_visit_gallery'],
    }),

    createGalleryAttachment: builder.mutation<
      TGalleryAttachmentApiResponse,
      TCreateGalleryAttachmentBody
    >({
      query: (body) => ({
        url: '/site-visit/gallery-attachments',
        method: 'POST',
        body,
      }),
      transformResponse(res: TGalleryAttachmentApiResponse) {
        return res;
      },
      invalidatesTags: (_result, _err, body) => [
        { type: GALLERY_TAG, id: `COLLECTION-${body.siteVisitGalleryCollectionId}` },
        { type: GALLERY_TAG, id: `ATTACHMENTS-${body.siteVisitGalleryCollectionId}` },
      ],
    }),

    updateGalleryAttachment: builder.mutation<
      TGalleryAttachmentApiResponse,
      TUpdateGalleryAttachmentBody & { id: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/site-visit/gallery-attachments/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse(res: TGalleryAttachmentApiResponse) {
        return res;
      },
      invalidatesTags: ['site_visit_gallery'],
    }),

    deleteGalleryAttachment: builder.mutation<
      void,
      { id: string; siteVisitGalleryCollectionId: string }
    >({
      query: ({ id }) => ({
        url: `/site-visit/gallery-attachments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _err, { siteVisitGalleryCollectionId }) => [
        { type: GALLERY_TAG, id: `ATTACHMENTS-${siteVisitGalleryCollectionId}` },
        { type: GALLERY_TAG, id: `COLLECTION-${siteVisitGalleryCollectionId}` },
      ],
    }),
  }),
});

export const {
  useGetProjectSiteVisitsQuery,
  useLazyGetProjectSiteVisitsQuery,
  useGetSiteVisitByIdQuery,
  useLazyGetSiteVisitByIdQuery,
  useCreateSiteVisitMutation,
  useUpdateSiteVisitMutation,
  useDeleteSiteVisitMutation,
  useGetGalleryCollectionsQuery,
  useGetGalleryCollectionByIdQuery,
  useCreateGalleryCollectionMutation,
  useUpdateGalleryCollectionMutation,
  useDeleteGalleryCollectionMutation,
  useGetGalleryAttachmentsQuery,
  useGetGalleryAttachmentByIdQuery,
  useCreateGalleryAttachmentMutation,
  useUpdateGalleryAttachmentMutation,
  useDeleteGalleryAttachmentMutation,
} = siteVisitApi;
