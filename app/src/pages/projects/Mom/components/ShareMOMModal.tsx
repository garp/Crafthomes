import { useState, type KeyboardEvent } from 'react';
import { IconX } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import ModalWrapper from '../../../../components/base/ModalWrapper';
import FormInput from '../../../../components/base/FormInput';
import { Button } from '../../../../components';
import { useShareMOMMutation } from '../../../../store/services/mom/mom';
import type { TErrorResponse } from '../../../../store/types/common.types';

type ShareMOMModalProps = {
  isOpen: boolean;
  onClose: () => void;
  momId: string;
  momTitle: string;
  onSuccess?: () => void;
};

export default function ShareMOMModal({
  isOpen,
  onClose,
  momId,
  momTitle,
  onSuccess,
}: ShareMOMModalProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [shareMOM, { isLoading: isSharing }] = useShareMOMMutation();
  const [showSuccess, setShowSuccess] = useState(false);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleAddEmail = () => {
    const trimmedEmail = currentEmail.trim();
    if (!trimmedEmail) return;

    if (!emailRegex.test(trimmedEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (emails.includes(trimmedEmail)) {
      toast.error('This email is already added');
      setCurrentEmail('');
      return;
    }

    setEmails([...emails, trimmedEmail]);
    setCurrentEmail('');
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter((email) => email !== emailToRemove));
  };

  const handleShare = async () => {
    if (emails.length === 0) {
      toast.error('Please add at least one email address');
      return;
    }

    try {
      await shareMOM({ id: momId, emails }).unwrap();
      setShowSuccess(true);
    } catch (error: unknown) {
      const err = error as { data?: TErrorResponse };
      if (err?.data?.message) {
        toast.error(err.data.message);
      } else {
        toast.error('Failed to share MOM');
      }
    }
  };

  const handleClose = () => {
    setEmails([]);
    setCurrentEmail('');
    setShowSuccess(false);
    onClose();
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setEmails([]);
    setCurrentEmail('');
    onClose();
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <>
      {/* Share Modal */}
      <ModalWrapper
        opened={isOpen && !showSuccess}
        onClose={handleClose}
        title='Share MOM'
        centered
      >
        <div className='space-y-4'>
          <p className='text-sm text-gray-600'>
            Share <span className='font-semibold'>{momTitle}</span> with others
          </p>

          {/* Email Input */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Email Addresses</label>
            <div className='flex gap-2'>
              <FormInput
                type='email'
                placeholder='Enter email address and press Enter'
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                onKeyDown={handleKeyPress}
                className='flex-1'
                inputClassName='!py-5'
              />
              <Button
                type='button'
                onClick={handleAddEmail}
                disabled={!currentEmail.trim()}
                className='px-4'
              >
                Add
              </Button>
            </div>
          </div>

          {/* Email Tags */}
          {emails.length > 0 && (
            <div>
              <p className='text-sm font-medium text-gray-700 mb-2'>
                Added Emails ({emails.length})
              </p>
              <div className='flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg min-h-[60px] max-h-[200px] overflow-y-auto'>
                {emails.map((email, index) => (
                  <div
                    key={index}
                    className='inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200'
                  >
                    <span className='text-sm text-gray-700'>{email}</span>
                    <button
                      type='button'
                      onClick={() => handleRemoveEmail(email)}
                      className='text-gray-400 hover:text-gray-600 transition-colors'
                    >
                      <IconX className='size-4' />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className='flex justify-end gap-3 mt-6'>
            <Button type='button' variant='outline' onClick={handleClose} disabled={isSharing}>
              Cancel
            </Button>
            <Button type='button' onClick={handleShare} disabled={isSharing || emails.length === 0}>
              {isSharing ? 'Sharing...' : 'Share'}
            </Button>
          </div>
        </div>
      </ModalWrapper>

      {/* Success Modal */}
      <ModalWrapper opened={showSuccess} onClose={handleSuccessClose} title='Success' centered>
        <div className='space-y-4'>
          <p className='text-sm text-gray-600'>
            MOM has been shared successfully with {emails.length} email
            {emails.length !== 1 ? 's' : ''}!
          </p>
          <div className='flex justify-end mt-6'>
            <Button type='button' onClick={handleSuccessClose}>
              Close
            </Button>
          </div>
        </div>
      </ModalWrapper>
    </>
  );
}
