import { useDisclosure } from '@mantine/hooks';
import CreateScreeen from '../../../components/common/CreateScreen';
import AddDeliverableSidebar from './components/AddDeliverableSidebar';

export default function DeliverablePage() {
  const [
    isOpenCreateDeliverableSidebar,
    { open: openCreateDeliverableSidebar, close: closeCreateDeliverableSidebar },
  ] = useDisclosure();
  return (
    <>
      <CreateScreeen
        createPageData={{
          buttonText: 'Create Deliverable',
          heading: 'DELIVERABLE',
          subtitle:
            'It looks like you don’t have any deliverable yet. Let’s create your first timeline to get started!',
          title: 'Get Started with Deliverable',
        }}
        onClick={openCreateDeliverableSidebar}
      />
      <AddDeliverableSidebar
        isOpen={isOpenCreateDeliverableSidebar}
        onClose={closeCreateDeliverableSidebar}
      />
    </>
  );
}
