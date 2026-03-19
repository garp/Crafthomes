import { IconArrowForwardUp, IconArrowLeft, IconArrowUp, IconDownload } from '@tabler/icons-react';
import { Avatar, Button, Image } from '../../../../components';
import PDF from '../../../../assets/img/pdf.png';

export default function Message() {
  return (
    <div className='flex flex-col bg-white h-full rounded-lg px-5 py-4 '>
      <div className='items-center flex gap-3'>
        <button className='cursor-pointer bg-slate-100 rounded-full p-[6px]'>
          <IconArrowLeft className='size-4' />
        </button>
        <p className='font-bold text-sm'>New Message</p>
      </div>

      {/* SENDER */}
      <div className='mt-3 flex justify-between'>
        <div>
          <p className='text-text-subHeading font-semibold text-sm'>Sender</p>
          <div className='flex items-center mt-1 gap-2'>
            <Avatar size='sm' name='R' />
            <p className='font-semibold '>Mr. Sharma</p>
          </div>
        </div>
        <p className='text-sm font-medium text-text-subHeading'>12:29 &#40;7 minutes ago&#41;</p>
      </div>

      {/* CLIENTS */}
      <div className='flex gap-4 mt-2'>
        <p className='flex items-center before:content-["•"] before:mr-2 font-semibold text-xs text-text-subHeading before:text-lg'>
          Client: M Sharma
        </p>
        <p className='flex items-center before:content-["•"] before:mr-2 font-semibold  text-xs text-text-subHeading before:text-lg'>
          Project: Cozy Retreat
        </p>
      </div>

      {/* ATTACHMENTS */}
      <div className='flex flex-wrap gap-5 mt-2'>
        <AttachmentCard />
        <AttachmentCard />
      </div>

      {/* MESSAGE TEXT */}
      <>
        <p className='font-medium mt-5  text-[#6c6c6c]'>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempora sint adipisci sed quas
          accusantium exercitationem? Aperiam quae dolores at ullam similique, mollitia dolore cum
          quaerat deleniti distinctio reiciendis tempore ab suscipit ducimus excepturi alias, iure
          rerum. Facilis minima adipisci incidunt sunt saepe amet eius suscipit doloribus recusandae
          minus ratione sapiente laborum architecto aliquid quae a cupiditate odio quod iure iusto
          dignissimos, quos veritatis reprehenderit numquam.
          <br />
        </p>
        <p className='font-medium mt-5  text-[#6c6c6c]'>
          ectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
          aliqua. amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut laLorem
          ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
          labore et dolore magna aliquar sit amet, consectetur adipiscing elit.
        </p>
        <p className='font-medium mt-5  text-[#6c6c6c]'>
          {' '}
          Best Regards,
          <br /> Kavin
        </p>
      </>

      {/* BUTTONS */}
      <div className='flex gap-3 sm:gap-5 mt-auto '>
        <Button
          radius='full'
          leftIcon={<IconArrowUp className='rotate-45 size-5' />}
          variant='outline'
          className='!text-sm !bg-white !h-9  !items-start'
        >
          Share
        </Button>
        <Button
          radius='full'
          leftIcon={<IconArrowForwardUp className='size-5' />}
          variant='outline'
          className='!text-sm !bg-white !h-9  !items-start'
        >
          Forward
        </Button>
      </div>
    </div>
  );
}

function AttachmentCard() {
  return (
    <div className='cursor-pointer w-[25rem] px-4 py-3 flex gap-4 rounded-md  ring-1 ring-gray-300'>
      <Image src={PDF} alt='pdfIcon' className='size-6' />
      <p className='text-sm'>Complete Site Map</p>
      <IconDownload className='cursor-pointer ml-auto size-5 text-text-subHeading' />
    </div>
  );
}
