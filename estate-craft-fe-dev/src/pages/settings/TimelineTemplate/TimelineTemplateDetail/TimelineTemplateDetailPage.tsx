import { useParams } from 'react-router-dom';
import Container from '../../../../components/common/Container';
import TimelineTemplateDetailHeader from './components/TimelineTemplateDetailHeader';
import TimelineTemplateListView from './components/TimelineTemplateListView';
import { useGetProjectTypeByIdQuery } from '../../../../store/services/projectType/projectTypeSlice';
import { ComponentLoader } from '../../../../components/common/loaders/ComponentLoader';

export default function TimelineTemplateDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: projectTypeData,
    isLoading,
    refetch: refetchData,
  } = useGetProjectTypeByIdQuery({ id: id || '' }, { skip: !id });

  const templateName = projectTypeData?.name || 'Timeline Template';

  if (isLoading) {
    return (
      <Container className='py-0 px-0'>
        <ComponentLoader text='Loading template...' minHeight={300} />
      </Container>
    );
  }

  return (
    <Container className='py-0 px-0'>
      <div className='px-5 py-4'>
        <TimelineTemplateDetailHeader templateName={templateName} />
      </div>
      <TimelineTemplateListView
        projectTypeId={id || ''}
        phases={projectTypeData?.masterPhases || []}
        refetchData={refetchData}
      />
    </Container>
  );
}
