import { useDisclosure } from '@mantine/hooks';
import MOMListPage from './components/MOMListPage';
import { lazy, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { TMOM } from '../../../store/types/mom.types';

const CreateMOMSidebar = lazy(() => import('./components/CreateMOMSidebar'));

export default function ProjectMomPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [isOpenSidebar, { open: openSidebar, close: closeSidebar }] = useDisclosure();
  const [selectedMOM, setSelectedMOM] = useState<TMOM | null>(null);

  const handleOpenSidebar = (mom?: TMOM) => {
    if (mom) {
      setSelectedMOM(mom);
    } else {
      setSelectedMOM(null);
    }
    openSidebar();
  };

  const handleCloseSidebar = () => {
    setSelectedMOM(null);
    closeSidebar();
  };

  if (!projectId) {
    return (
      <div className='flex justify-center items-center min-h-[200px]'>
        <p className='text-text-subHeading'>Project ID is missing</p>
      </div>
    );
  }

  return (
    <>
      <MOMListPage openSidebar={handleOpenSidebar} projectId={projectId} />
      <CreateMOMSidebar
        isOpenSidebar={isOpenSidebar}
        closeSidebar={handleCloseSidebar}
        initialValues={selectedMOM}
        mode={selectedMOM ? 'edit' : 'create'}
        projectId={projectId}
      />
    </>
  );
}
