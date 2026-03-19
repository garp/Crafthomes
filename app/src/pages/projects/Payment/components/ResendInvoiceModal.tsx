import { useState } from 'react';
import ModalWrapper from '../../../../components/base/ModalWrapper';
import { Button } from '../../../../components/base';
import UserSelector from '../../../../components/common/selectors/UserSelector';
import type { TResendInvoiceModalProps } from '../../../../types/payment.types';
import infoIcon from '../../../../assets/img/infoIcon.svg';

export default function ResendInvoiceModal({
  opened,
  onClose,
  onResend,
}: TResendInvoiceModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  function handleResend() {
    if (selectedUserId) {
      onResend(selectedUserId);
      setSelectedUserId(null);
    }
  }

  return (
    <ModalWrapper
      opened={opened}
      onClose={onClose}
      title=''
      size='lg'
      centered
      withCloseButton={false}
    >
      <div className='space-y-4 -mt-4'>
        {/* Info Icon */}
        <div className='flex justify-center'>
          <img src={infoIcon} alt='Info' className='w-20 h-20' />
        </div>

        {/* Title */}
        <div className='text-center'>
          <h2 className='text-xl font-bold text-black'>Resend Invoice</h2>
        </div>

        {/* Description */}
        <div className='text-center'>
          <p className='text-sm text-gray-600'>
            You're about to resend this invoice to a different recipient. Please confirm the details
            before proceeding.
          </p>
        </div>

        {/* Resend To Field */}
        <div>
          <label className='block text-sm font-bold text-black mb-2'>Resend To</label>
          <UserSelector value={selectedUserId} setValue={setSelectedUserId} className='w-full' />
        </div>

        {/* Action Buttons */}
        <div className='flex gap-3 pt-3 border-t border-gray-200'>
          <Button
            onClick={onClose}
            className='flex-1 bg-white border border-red-500 !text-red-500 hover:bg-white'
            radius='full'
          >
            Cancel
          </Button>
          <Button
            onClick={handleResend}
            disabled={!selectedUserId}
            className='flex-1 bg-black text-white hover:bg-gray-800'
            radius='full'
          >
            Resend Invoice
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}
