import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '../../../../components/base/button/BackButton';
import Container from '../../../../components/common/Container';
import SiteVisitForm from '../components/SiteVisitForm';
import type { TCreateSiteVisitFormData } from '../../../../validators/siteVisit.validators';
import { useCreateSiteVisitMutation, type TCreateSiteVisitBody } from '../services';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../../../store/types/common.types';

export default function CreateSiteVisitPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [createSiteVisit, { isLoading: isCreating }] = useCreateSiteVisitMutation();

  const initialValues: TCreateSiteVisitFormData = {
    startedAt: new Date(),
    engineerIds: [],
    status: 'SCHEDULED',
    priority: null,
    summaryText: '',
    taskSnapshots: [],
    attachments: [],
  };

  function onSubmit({
    data,
    resetForm,
  }: {
    data: TCreateSiteVisitFormData;
    resetForm: () => void;
  }) {
    if (!id) {
      toast.error('Project ID is missing');
      return;
    }

    const payload: TCreateSiteVisitBody = {
      projectId: id,
      startedAt: data.startedAt.toISOString(),
      engineerIds: data.engineerIds,
      status: data.status,
      priority: data.priority ?? null,
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
      ...(data.attachments?.length ? { attachments: data.attachments } : {}),
    };

    createSiteVisit(payload)
      .unwrap()
      .then(() => {
        toast.success('Site visit created successfully');
        resetForm();
        navigate(`/projects/${id}/site-visit`);
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error.data.message);
        } else {
          toast.error('Failed to create site visit');
        }
        console.error('Error creating site visit:', error);
      });
  }

  return (
    <Container className='h-full w-full'>
      <BackButton backTo={`/projects/${id}/site-visit`}>CREATE SITE VISIT</BackButton>
      <SiteVisitForm
        onSubmit={onSubmit}
        mode='create'
        disabled={isCreating}
        initialValues={initialValues}
        projectId={id || ''}
        isSubmitting={isCreating}
      />
    </Container>
  );
}
