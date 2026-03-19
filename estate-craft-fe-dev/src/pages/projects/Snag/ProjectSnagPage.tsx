// import ProjectLayout from '../../../components/layout/ProjectLayout';
import { useParams } from 'react-router-dom';
import CreateSnagScreeen from './components/CreateSnagScreen';
import SnagTable from './components/SnagTable';
import { useGetProjectSnagsQuery } from '../../../store/services/snag/snagSlice';

export default function ProjectSnagPage() {
  const { id } = useParams();
  const { data: snagData } = useGetProjectSnagsQuery({
    projectId: id,
  });

  // Show empty state if no snags exist
  if (snagData?.totalCount === 0 || snagData?.snags?.length === 0) {
    return (
      // <ProjectLayout>
      <CreateSnagScreeen />
      // </ProjectLayout>
    );
  }

  // Show table if snags exist
  return (
    // <ProjectLayout>
    <SnagTable />
    // </ProjectLayout>
  );
}
