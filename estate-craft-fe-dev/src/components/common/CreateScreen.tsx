// import { Link } from 'react-router-dom';

import type { TCreatePageProps } from '../../types/common.types';

import Container from './Container';
import { Button } from '../base';

export default function CreateScreeen({ createPageData, onClick }: TCreatePageProps) {
  return (
    <Container className=' h-full'>
      <h6 className='font-bold text-sm'>{createPageData.heading}</h6>
      <hr className='border border-gray-200 mt-2' />
      <div className=' h-full w-full flex flex-col  items-center justify-center'>
        <p className=' font-bold text-lg'>{createPageData.title}</p>
        <p className='mt-2 text-text-subHeading max-w-[23rem] text-center font-medium'>
          {createPageData.subtitle}
        </p>
        {/* <Link to={createPageData.link}> */}
        <Button onClick={onClick} radius='full' className='mt-4'>
          {createPageData.buttonText}
        </Button>
        {/* </Link> */}
      </div>
    </Container>
  );
}
