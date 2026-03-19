'use client';
import IconButton from './IconButton';
import { IconArrowLeft } from '@tabler/icons-react';
import type { TBackButtonProps } from '../../../types/base';
import { cn } from '../../../utils/helper';
import { useNavigate } from 'react-router-dom';

export default function BackButton({ children, className, backTo }: TBackButtonProps) {
  const navigate = useNavigate();
  return (
    <div className={cn(`flex gap-2 items-center`, className)}>
      <IconButton onClick={() => navigate(backTo)} className='bg-neutral-100'>
        <IconArrowLeft className='size-4' />
      </IconButton>
      <h6 className='text-sm font-bold'>{children}</h6>
    </div>
  );
}
