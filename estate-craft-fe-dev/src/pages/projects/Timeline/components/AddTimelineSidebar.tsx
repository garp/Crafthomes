import { useMemo } from 'react';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';

import { useCreateProjectTimelineMutation } from '../../../../store/services/projectTimeline/projectTimelineSlice';
import { useGetProjectsQuery } from '../../../../store/services/project/projectSlice';
import { useGetProjectTypesQuery } from '../../../../store/services/projectType/projectTypeSlice';
import type { TErrorResponse } from '../../../../store/types/common.types';

import type { TAddTimelineSidebarProps } from '../types/types';
import { TimelineForm } from './TimelineForm';
import {
  addTimelineDays,
  type TCreateTimelineFormData,
} from '../../../../validators/projectTimeline';
import type { TOnSubmitArgs } from '../../../../types/common.types';
import SidebarModal from '../../../../components/base/SidebarModal';

export const AddTimelineSidebar = ({ isOpen, onClose }: TAddTimelineSidebarProps) => {
  const { id: projectId } = useParams();
  const [createTimeline, { isLoading: isSubmitting }] = useCreateProjectTimelineMutation();
  const { data: projectsData } = useGetProjectsQuery(
    { id: projectId ?? '', pageLimit: '1' },
    { skip: !projectId || !isOpen },
  );

  const project = useMemo(() => projectsData?.projects?.[0] ?? null, [projectsData?.projects]);
  const { data: projectTypesData } = useGetProjectTypesQuery(
    { pageNo: '0', pageLimit: '10' },
    { skip: !isOpen },
  );

  const projectStartDate = useMemo(
    () => (project?.startDate ? new Date(project.startDate) : null),
    [project?.startDate],
  );
  const projectEndDate = useMemo(
    () => (project?.endDate ? new Date(project.endDate) : null),
    [project?.endDate],
  );

  const schemaContext = useMemo(
    () => (projectStartDate || projectEndDate ? { projectStartDate, projectEndDate } : undefined),
    [projectStartDate, projectEndDate],
  );

  const templateOptions = useMemo(() => {
    if (projectTypesData?.projectTypes?.length) {
      return projectTypesData.projectTypes.map((projectType) => ({
        label: projectType.name,
        value: projectType.id,
        duration: projectType.totalDuration ?? 0,
      }));
    }
    return [];
  }, [projectTypesData?.projectTypes]);

  function onSubmit({ data, resetForm }: TOnSubmitArgs<TCreateTimelineFormData>) {
    if (!projectId) {
      toast.error('Unable to create timeline — missing Project ID');
      return;
    }

    createTimeline({
      name: data.name,
      projectId,
      plannedStart: data.plannedStart,
      plannedEnd: data.plannedEnd ?? null,
      templateTimelineId: data.templateTimelineId ?? null,
    })
      .unwrap()
      .then(() => {
        toast.success('Timeline created successfully');
        resetForm();
        onClose();
      })
      .catch((error: { data: TErrorResponse }) => {
        toast.error(error?.data?.message || 'Internal server error');
        console.error('Error creating timeline:', error);
      });
  }

  const initialValues: TCreateTimelineFormData = useMemo(() => {
    const templateId = templateOptions.length === 1 ? templateOptions[0].value : null;
    const selectedTemplate = templateId
      ? templateOptions.find((o) => o.value === templateId)
      : null;
    const plannedStart = projectStartDate ?? new Date();
    if (selectedTemplate) {
      return {
        name: selectedTemplate?.label ?? '',
        templateTimelineId: templateId,
        plannedStart,
        plannedEnd: addTimelineDays(plannedStart, selectedTemplate.duration ?? 0),
      };
    }
    return {
      name: '',
      templateTimelineId: templateId,
      plannedStart,
      plannedEnd: projectEndDate ?? null,
    };
  }, [projectEndDate, projectStartDate, templateOptions]);

  return (
    <SidebarModal heading='Add Timeline' opened={isOpen} onClose={onClose}>
      <TimelineForm
        key={`${projectId ?? 'no-project'}-${isOpen ? 'open' : 'closed'}`}
        mode='create'
        disabled={isSubmitting}
        onSubmit={onSubmit}
        initialValues={initialValues}
        schemaContext={schemaContext}
        templateOptions={templateOptions}
      />
    </SidebarModal>
  );
};
