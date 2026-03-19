import { useMemo } from 'react';
import { toast } from 'react-toastify';
import { useEditProjectTimelineMutation } from '../../../../store/services/projectTimeline/projectTimelineSlice';
import { useGetProjectsQuery } from '../../../../store/services/project/projectSlice';
import type { TErrorResponse } from '../../../../store/types/common.types';

import type { TEditTimelineSidebarProps } from '../types/types';
import { type TCreateTimelineFormData } from '../../../../validators/projectTimeline';

import SidebarModal from '../../../../components/base/SidebarModal';
import { TimelineForm } from './TimelineForm';
import type { TOnSubmitArgs } from '../../../../types/common.types';

export const EditTimelineSidebar = ({ isOpen, onClose, timeline }: TEditTimelineSidebarProps) => {
  const [updateTimeline, { isLoading: isSubmitting }] = useEditProjectTimelineMutation();
  const projectId = timeline?.projectId ?? timeline?.project?.id;
  const { data: projectsData } = useGetProjectsQuery(
    { id: projectId ?? '', pageLimit: '1' },
    { skip: !projectId || !isOpen },
  );

  const project = useMemo(() => projectsData?.projects?.[0] ?? null, [projectsData?.projects]);

  const schemaContext = useMemo(() => {
    const projectStartDate = project?.startDate ? new Date(project.startDate) : null;
    const projectEndDate = project?.endDate ? new Date(project.endDate) : null;
    return projectStartDate || projectEndDate ? { projectStartDate, projectEndDate } : undefined;
  }, [project]);

  const initialValues: TCreateTimelineFormData = {
    name: timeline?.name || '',
    templateTimelineId: null,
    plannedStart: timeline?.plannedStart ? new Date(timeline.plannedStart) : new Date(),
    plannedEnd: timeline?.plannedEnd ? new Date(timeline.plannedEnd) : null,
    timelineStatus:
      timeline?.timelineStatus === 'ARCHIVED' || timeline?.timelineStatus === 'DELETED'
        ? null
        : timeline?.timelineStatus || 'PENDING',
  };

  function onSubmit({ data, resetForm }: TOnSubmitArgs<TCreateTimelineFormData>) {
    if (!timeline?.id) {
      toast.error('Unable to update timeline');
      return;
    }

    updateTimeline({
      id: timeline.id,
      data: {
        name: data.name,
        plannedStart: data.plannedStart,
        plannedEnd: data.plannedEnd ?? null,
        timelineStatus: data.timelineStatus || undefined,
      },
    })
      .unwrap()
      .then(() => {
        toast.success('Timeline updated successfully');
        resetForm();
        onClose();
      })
      .catch((error: { data: TErrorResponse }) => {
        toast.error(error?.data?.message || 'Internal server error');
        console.error('Error updating timeline:', error);
      });
  }

  return (
    <SidebarModal heading='Edit Timeline' opened={isOpen} onClose={onClose}>
      <TimelineForm
        mode='edit'
        disabled={isSubmitting}
        onSubmit={onSubmit}
        initialValues={initialValues}
        schemaContext={schemaContext}
      />
    </SidebarModal>
  );
};
