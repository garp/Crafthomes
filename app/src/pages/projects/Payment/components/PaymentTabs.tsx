import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '../../../../components/base';
import { PAYMENT_TABS } from '../constants/constants';

interface PaymentTabsProps {
  inboxCount: number;
  draftsCount: number;
}

export default function PaymentTabs({ inboxCount, draftsCount }: PaymentTabsProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Only set default tab once on mount if not present
  useEffect(() => {
    if (!searchParams.get('tab')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('tab', PAYMENT_TABS.INBOX);
      setSearchParams(newParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const activeTab = searchParams.get('tab') || PAYMENT_TABS.INBOX;

  function handleTabSwitch(tab: string) {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    setSearchParams(newParams, { replace: true });
  }

  return (
    <div className='flex'>
      <Button
        onClick={() => handleTabSwitch(PAYMENT_TABS.INBOX)}
        className={`!font-medium !rounded-l !rounded-r-none px-5 !py-3 !h-9 ${
          activeTab === PAYMENT_TABS.INBOX
            ? '!bg-bg-primary text-white'
            : '!bg-gray-300 !text-text-subHeading'
        }`}
      >
        Inbox({inboxCount})
      </Button>
      <Button
        onClick={() => handleTabSwitch(PAYMENT_TABS.DRAFTS)}
        className={`!font-medium !rounded-r !rounded-l-none px-5 !py-3 !h-9 ${
          activeTab === PAYMENT_TABS.DRAFTS
            ? '!bg-bg-primary text-white'
            : '!bg-gray-300 !text-text-subHeading'
        }`}
      >
        Drafts({draftsCount})
      </Button>
    </div>
  );
}
