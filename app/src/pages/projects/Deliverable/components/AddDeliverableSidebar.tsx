import SidebarModal from '../../../../components/base/SidebarModal';
import type { TSidebarProps } from '../../../../types/common.types';
import DeliverableForm from './DeliverableForm';

export default function AddDeliverableSidebar({ isOpen, onClose }: TSidebarProps) {
  const initialValues = {
    name: '',
    attendees: [],
    dueDate: new Date(),
    priority: '',
  };
  function onSubmit() {}
  return (
    <>
      <SidebarModal heading='Add Deliverable' opened={isOpen} onClose={onClose}>
        <DeliverableForm disabled initialValues={initialValues} mode='create' onSubmit={onSubmit} />
      </SidebarModal>
    </>
  );
}
