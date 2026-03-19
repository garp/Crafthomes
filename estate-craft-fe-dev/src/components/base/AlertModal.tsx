import { type ModalProps } from '@mantine/core';
import type { TAlertModaProps } from '../../types/common.types';
import type { ReactNode } from 'react';

import { Button } from './button';
import ModalWrapper from './ModalWrapper';

export default function AlertModal({
  title,
  subtitle = `This action can't be undone`,
  onConfirm,
  isLoading,
  isDeleting,
  onClose,
  children,
  ...props
}: TAlertModaProps & ModalProps & { children?: ReactNode; isDeleting?: boolean }) {
  return (
    <>
      <ModalWrapper
        title={title}
        titleClassName='after-content-["?"] after:absolute after:right-0 after:top-0 after:bg-white after:pl-1 after:text-inherit'
        onClose={onClose}
        centered
        {...props}
      >
        {subtitle ? <p className='font-medium text-text-subHeading'>{subtitle}</p> : null}
        {children}
        <div className='flex justify-between mt-8 '>
          <Button disabled={isLoading} onClick={onConfirm} className='bg-red-400 hover:bg-red-500'>
            {isDeleting ? 'Deleting...' : 'Confirm'}
          </Button>
          <Button disabled={isLoading} onClick={onClose}>
            Cancel
          </Button>
        </div>
      </ModalWrapper>
    </>
  );
}
