import { Outlet } from 'react-router-dom';
import type { TProjectLayoutProps } from '../../types/common.types';
import { cn } from '../../utils/helper';
import Breadcrumb from '../common/Breadcrumb';

export default function ProjectLayout({ className }: TProjectLayoutProps) {
  return (
    <div className={cn('h-full flex flex-col ', className)}>
      <Breadcrumb className='mb-5' />
      <Outlet />
    </div>
  );
}
