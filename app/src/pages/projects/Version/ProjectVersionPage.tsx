import { useNavigate, useParams } from 'react-router-dom';
import CreateScreeen from '../../../components/common/CreateScreen';
import { createVersionScreenData } from './constants/constants';
// import ProjectLayout from '../../../components/layout/ProjectLayout';

export default function ProjectVersionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <>
      {/* <ProjectLayout> */}
      <CreateScreeen
        onClick={() => navigate(`/projects/${id}/version/create-version`)}
        createPageData={createVersionScreenData}
      />
      {/* </ProjectLayout> */}
    </>
  );
}
