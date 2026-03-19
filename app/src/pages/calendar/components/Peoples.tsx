import { useSearchParams } from 'react-router-dom';
import { Image } from '../../../components';
import { PEOPLE } from '../constants/constants';

export default function Peoples() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPerson = searchParams.get('person');
  return (
    <>
      <div className='min-h-full shrink-0 flex-1/4 flex flex-col gap-4 px-5 py-5 bg-white rounded-lg'>
        <p className='font-bold'>People</p>
        <hr className='border-gray-200' />

        {/*  */}
        <div className='grid grid-cols-3 h-full '>
          {PEOPLE.map((person) => (
            <div className='space-y-2 '>
              <Image
                onClick={() => setSearchParams({ person: person?.id })}
                className={`${selectedPerson === person?.id ? 'border-4' : selectedPerson ? '!opacity-40' : ''} cursor-pointer size-20 object-cover rounded-full`}
                src={person?.profileImg}
                alt='profile-image'
              />
              <p className='text-center'>{person?.name}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
