import { Skeleton, type SkeletonProps } from '@mantine/core';
import FormLabel from './FormLabel';
import { cn } from '../../utils/helper';

export function FormFieldSkeleton({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn(`flex flex-col h-full`, className)}>
      <FormLabel>{label}</FormLabel>
      <Skeleton height={'100%'} />
    </div>
  );
}

export function FormFieldSkeleton2({ ...props }: SkeletonProps) {
  return (
    <>
      <Skeleton width={'60%'} height={46} {...props} />
    </>
  );
}

export function TaskSkelton() {
  return (
    <>
      {/* //{' '} */}
      {/* <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-8 border w-full'> */}
      {Array.from({ length: 10 }, (_, index) => (
        <div
          key={index + 99}
          className='h-[22.5rem] bg-white rounded-lg shadow-slate300 p-4 hover:shadow-md shadow-lg space-y-4'
        >
          <div className='flex justify-between'>
            <Skeleton height={16} width={'50%'} />
            <Skeleton className='!rounded-full' height={35} width={35} />
          </div>

          <div className='space-y-2'>
            <Skeleton height={10} width={'70%'} />
            <Skeleton height={10} width={'60%'} />
          </div>

          <hr />
          <div className='space-y-4'>
            <Skeleton height={10} width={'40%'} />
            <Skeleton height={10} width={'60%'} />
          </div>
          <hr />
          <div className='space-y-4'>
            <Skeleton height={10} width={'60%'} />
            <Skeleton height={10} width={'40%'} />
          </div>
          <hr />
          <Skeleton height={14} width={'50%'} />
        </div>
      ))}
      {/* //{' '} */}
      {/* </div> */}
    </>
  );
}

export function ProjectStatsSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index * 11}
          className='h-[7rem] bg-white rounded-lg shadow-slate300 hover:shadow-md shadow-lg space-y-4 flex gap-5 justify-between  p-4'
        >
          <div className='space-y-5 w-full'>
            <Skeleton height={18} width={'60%'} />
            <Skeleton height={20} width={'30%'} />
          </div>
          <div>
            <Skeleton height={60} width={60} className='!rounded-full' />
          </div>
        </div>
      ))}
    </>
  );
}

export function QuotationSkeleton() {
  return (
    <div className='bg-white flex flex-col px-5 h-full w-full'>
      <div className='mt-10 space-y-3'>
        <Skeleton height={16} width={'10rem'} />
        <Skeleton height={20} width={'15rem'} />
      </div>

      <div className='mt-8 space-y-3'>
        <Skeleton height={14} width={'8rem'} />
        <div className='space-y-2'>
          <Skeleton height={14} width={'30vw'} />
          {/* <Skeleton height={14} width={'40vw'} /> */}
          <Skeleton height={14} width={'45vw'} />
          {/* <Skeleton height={14} width={'50vw'} /> */}
          {/* <Skeleton height={12} width={'30vw'} />
          <Skeleton height={12} width={'40vw'} /> */}
        </div>
      </div>

      <Skeleton className='mt-10' height={'100%'} />
    </div>
  );
}

/** Skeleton for Edit Task sidebar while task data is loading (title, description, comment, footer) */
export function EditTaskSidebarSkeleton() {
  return (
    <div className='flex flex-col h-full px-6 py-5 gap-6'>
      {/* Task title */}
      <div className='space-y-2'>
        <Skeleton height={12} width={80} radius='sm' />
        <Skeleton height={44} width='100%' radius='md' />
      </div>
      {/* Description */}
      <div className='space-y-2'>
        <Skeleton height={12} width={90} radius='sm' />
        <Skeleton height={24} width='100%' radius='sm' />
        <Skeleton height={120} width='100%' radius='md' />
      </div>
      {/* Comment */}
      <div className='space-y-2'>
        <Skeleton height={12} width={70} radius='sm' />
        <Skeleton height={80} width='100%' radius='md' />
      </div>
      {/* Spacer to push footer down */}
      <div className='flex-1 min-h-[40px]' />
      {/* Footer actions */}
      <div className='flex flex-wrap gap-3 pt-4 border-t border-gray-200'>
        <Skeleton height={40} width={160} radius='md' />
        <Skeleton height={40} width={120} radius='md' />
        <Skeleton height={40} width={120} radius='md' />
      </div>
    </div>
  );
}
