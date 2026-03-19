/**
 * Site Visit feature – re-exports API hooks and types from store.
 * Import from here for convenience: e.g. import { useGetProjectSiteVisitsQuery } from './services';
 */

export {
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
} from '../../../../store/services/siteVisit/siteVisitSlice';

export type {
  SiteVisitStatus,
  SiteVisitPriority,
  TSiteVisit,
  TSiteVisitEngineer,
  TSiteVisitTaskSnapshot,
  TSiteVisitAttachment,
  TCreateSiteVisitBody,
  TUpdateSiteVisitBody,
  TGetSiteVisitsArgs,
  TGetSiteVisitsResponse,
  TGalleryCollection,
  TGalleryCollectionAttachment,
  TGalleryAttachment,
  TGalleryAttachmentApiResponse,
  TGalleryAttachmentsListApiResponse,
  TCreateGalleryCollectionBody,
  TUpdateGalleryCollectionBody,
  TCreateGalleryAttachmentBody,
  TUpdateGalleryAttachmentBody,
} from '../../../../store/types/siteVisit.types';
