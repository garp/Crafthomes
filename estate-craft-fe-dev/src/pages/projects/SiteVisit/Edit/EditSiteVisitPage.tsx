import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import BackButton from '../../../../components/base/button/BackButton';
import Container from '../../../../components/common/Container';
import SiteVisitForm from '../components/SiteVisitForm';
import SiteVisitGallerySection from '../components/SiteVisitGallerySection';
import type { TCreateSiteVisitFormData } from '../../../../validators/siteVisit.validators';
import {
  useGetSiteVisitByIdQuery,
  useUpdateSiteVisitMutation,
  type TUpdateSiteVisitBody,
} from '../services';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../../../store/types/common.types';

function mapSiteVisitToFormValues(siteVisit: {
  startedAt: string;
  status: string;
  priority?: string | null;
  summaryText: string | null;
  engineers: { engineerId: string }[];
  taskSnapshots: {
    originalTaskId: string | null;
    taskTitle: string;
    statusAtVisit: string;
    notes: string | null;
    completionPercentage: number | null;
    attachments?: { name: string; url: string; key: string | null; type: string | null }[];
  }[];
  attachments?: { name: string; url: string; key: string | null; type: string | null }[];
}): TCreateSiteVisitFormData {
  return {
    startedAt: new Date(siteVisit.startedAt),
    engineerIds: siteVisit.engineers?.map((e) => e.engineerId) ?? [],
    status: siteVisit.status as TCreateSiteVisitFormData['status'],
    priority: (siteVisit.priority as TCreateSiteVisitFormData['priority']) ?? null,
    summaryText: siteVisit.summaryText ?? '',
    taskSnapshots:
      siteVisit.taskSnapshots?.map((t) => ({
        originalTaskId: t.originalTaskId ?? undefined,
        taskTitle: t.taskTitle,
        statusAtVisit: t.statusAtVisit,
        notes: t.notes ?? '',
        completionPercentage: t.completionPercentage ?? null,
        attachments:
          t.attachments?.map((a) => ({
            name: a.name,
            url: a.url,
            key: a.key ?? '',
            type: a.type ?? 'application/octet-stream',
          })) ?? [],
      })) ?? [],
    attachments:
      siteVisit.attachments?.map((a) => ({
        name: a.name,
        url: a.url,
        key: a.key ?? '',
        type: a.type ?? 'application/octet-stream',
      })) ?? [],
  };
}

export default function EditSiteVisitPage() {
  const { id, siteVisitId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#gallery') {
      const el = document.getElementById('gallery');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash, siteVisitId]);
  const {
    data: siteVisit,
    isFetching,
    isError,
  } = useGetSiteVisitByIdQuery(siteVisitId ?? '', {
    skip: !siteVisitId,
  });
  const [updateSiteVisit, { isLoading: isUpdating }] = useUpdateSiteVisitMutation();

  const initialValues: TCreateSiteVisitFormData | null = siteVisit
    ? mapSiteVisitToFormValues(siteVisit)
    : null;

  function onSubmit({ data }: { data: TCreateSiteVisitFormData }) {
    if (!siteVisitId || !id) {
      toast.error('Site visit or project ID is missing');
      return;
    }

    const payload: TUpdateSiteVisitBody = {
      status: data.status,
      priority: data.priority ?? null,
      startedAt: data.startedAt.toISOString(),
      engineerIds: data.engineerIds,
      summaryText: data.summaryText || null,
      taskSnapshots: data.taskSnapshots?.map((task) => ({
        originalTaskId: task.originalTaskId || null,
        taskTitle: task.taskTitle,
        statusAtVisit: task.statusAtVisit,
        notes: task.notes || null,
        completionPercentage: task.completionPercentage ?? null,
        ...(task.attachments?.length
          ? {
              attachments: task.attachments.map((a) => ({
                name: a.name,
                url: a.url,
                key: a.key,
                type: a.type,
              })),
            }
          : {}),
      })),
      attachments:
        data.attachments?.map((a) => ({ name: a.name, url: a.url, key: a.key, type: a.type })) ??
        [],
    };

    updateSiteVisit({ id: siteVisitId, ...payload })
      .unwrap()
      .then(() => {
        toast.success('Site visit updated successfully');
        navigate(`/projects/${id}/site-visit`);
      })
      .catch((error: { data?: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error.data.message);
        } else {
          toast.error('Failed to update site visit');
        }
        console.error('Error updating site visit:', error);
      });
  }

  if (isFetching || !initialValues) {
    return (
      <Container className='h-full w-full'>
        <BackButton backTo={`/projects/${id}/site-visit`}>EDIT SITE VISIT</BackButton>
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500' />
        </div>
      </Container>
    );
  }

  if (isError || !siteVisit) {
    return (
      <Container className='h-full w-full'>
        <BackButton backTo={`/projects/${id}/site-visit`}>EDIT SITE VISIT</BackButton>
        <div className='text-center py-12 text-gray-500'>Site visit not found</div>
      </Container>
    );
  }

  return (
    <Container className='h-full w-full pb-28'>
      <BackButton backTo={`/projects/${id}/site-visit`}>EDIT SITE VISIT</BackButton>

      <SiteVisitForm
        onSubmit={onSubmit}
        mode='edit'
        disabled={isUpdating}
        initialValues={initialValues}
        projectId={id ?? ''}
        isSubmitting={isUpdating}
      />

      {/* Gallery section at the bottom - pb-28 on Container keeps content above fixed Update footer */}
      {siteVisitId && (
        <div id='gallery' className='scroll-mt-4 pb-4'>
          <SiteVisitGallerySection siteVisitId={siteVisitId} />
        </div>
      )}
    </Container>
  );
}
