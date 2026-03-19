import { useSearchParams } from 'react-router-dom';
import { Button } from '../../../components';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function LibraryHeader() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTab = searchParams.get('tab');
  useEffect(() => {
    if (!selectedTab) {
      setSearchParams({ tab: 'elementLibraries' });
    }
  }, [searchParams, setSearchParams]);
  return (
    <div className='flex flex-col gap-2 '>
      <h6 className='font-bold'>ALl Libraries</h6>
      <div className='flex md:flex-row flex-col justify-between gap-y-3 md:items-center'>
        <div className='flex border-y border-gray-200 py-3'>
          <Button
            radius='sm'
            className={`rounded-r-none ${selectedTab === 'elementLibraries' ? '!bg-[#4C5C6A]' : '!bg-gray-300 !text-text-subHeading'}`}
            onClick={() => setSearchParams({ tab: 'elementLibraries' })}
          >
            Element Libraries
          </Button>
          <Button
            radius='sm'
            className={`rounded-l-none ${selectedTab === 'rateContracts' ? '!bg-[#4C5C6A]' : '!bg-gray-300 !text-text-subHeading'}`}
            onClick={() => setSearchParams({ tab: 'rateContracts' })}
          >
            Rate Contracts
          </Button>
        </div>
        {selectedTab === 'rateContracts' && (
          <Link to={'/libraries/add-new-role-contract'}>
            <Button variant='primary' radius='full' className='!text-sm !font-medium'>
              Add New Role Contract
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
