import { IconExternalLink } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Button, Image } from '../base';
import { Switch } from '@mantine/core';
import GoogleDrive from '../../../src/assets/img/driveLogo.png';

export default function IntegrationCard() {
  return (
    <div className='bg-white flex flex-col gap-4 rounded-xl shadow-md px-4 py-5'>
      {/* TOP SECTION */}
      <section className='flex  justify-between w-full'>
        <div>
          <p className='font-bold'>Google Drive</p>
          <Link
            target='_blank'
            to={'https://google.com'}
            className='flex gap-1 items-center text-xs text-text-subHeading'
          >
            google.com
            <IconExternalLink className='size-4' />
          </Link>
        </div>
        <Image src={GoogleDrive} alt='logo' />
      </section>

      <hr className='border-gray-300' />

      {/* BOTTOM SECTION */}
      <>
        <p className='text-[#6C6C6C] text-sm font-medium'>
          Add powerful search capabilities that offer speed, realiability and collaboration.
        </p>

        <div className='flex justify-between items-center'>
          <Button radius='full' className='!h-9 bg-white border-[2px]' variant='outline'>
            View Integration
          </Button>
          <Switch defaultChecked color='dark' size='lg' />
        </div>
      </>
    </div>
  );
}
