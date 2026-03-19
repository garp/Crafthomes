import { useNavigate } from 'react-router-dom';
import { IconArrowLeft } from '@tabler/icons-react';
import IconButton from '../../../../../components/base/button/IconButton';

type TimelineTemplateDetailHeaderProps = {
  templateName: string;
};

export default function TimelineTemplateDetailHeader({
  templateName,
}: TimelineTemplateDetailHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-3'>
        <IconButton
          onClick={() => navigate('/settings/phase?subtab=timelines')}
          className='p-2.5 rounded-full bg-gray-100 hover:bg-gray-200'
        >
          <IconArrowLeft className='size-4' />
        </IconButton>
        <div>
          <h1 className='text-xl font-bold text-gray-900'>{templateName}</h1>
          <p className='text-sm text-gray-500'>Manage phases and tasks for this template</p>
        </div>
      </div>
    </div>
  );
}
