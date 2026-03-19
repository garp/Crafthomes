import { IconPlus } from '@tabler/icons-react';
import { Button } from '../base';
import FormCombobox from '../base/FormCombobox';
import FormDate from '../base/FormDate';
import FormInput from '../base/FormInput';
import FormSelect from '../base/FormSelect';
import { Textarea } from '@mantine/core';

export default function AddNewRoleContractForm() {
  return (
    <div className='flex flex-col gap-5'>
      {/* HEADER SECTION */}
      <div className='rounded-md p-4 bg-white space-y-2'>
        <h6 className='font-bold text-sm'>All Libraries</h6>
        <hr className='border-gray-200' />
        <div className='flex justify-between items-center'>
          <p className='font-bold text-sm'>Create Role Contract</p>
          <Button variant='outline' radius='full' className='!h-9 !font-medium !text-sm !bg-white'>
            Add New Role Contract
          </Button>
        </div>
      </div>

      <form className='space-y-5 flex flex-col'>
        {/* CREATE CONTRACT FORM */}
        <section className='rounded-md p-4 bg-white space-y-2'>
          <h6 className='font-bold text-sm'>Create Contract</h6>
          <hr className='border-gray-200' />
          {/* CONTRACT NAME */}
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-5 mt-5'>
            <div className='flex flex-col'>
              <label className='text-text-subHeading text-xs font-medium mb-2 '>
                Contract Name
              </label>
              <FormInput
                placeholder='Contract Name'
                value={''}
                onChange={() => {}}
                required
                className=''
              />
            </div>
            <div className='flex flex-col'>
              <label className='text-text-subHeading text-xs font-medium mb-2 '>Buyer Name</label>
              <FormInput
                placeholder='Buyer Name'
                value={''}
                onChange={() => {}}
                required
                className=''
              />
            </div>
            <div className='flex flex-col'>
              <label className='text-text-subHeading text-xs font-medium mb-2 '>Vendor</label>
              <FormSelect
                options={[{ label: 'vendor1', value: 'vendor1' }]}
                placeholder='Select Vendor'
                value={''}
                onChange={() => {}}
                required
                className=''
              />
            </div>
            <div className='flex flex-col'>
              <label className='block text-xs text-text-subHeading font-medium mb-2 '>
                Vendor ID
              </label>
              <FormSelect
                options={[{ label: 'vendor1', value: 'vendor1' }]}
                placeholder='Vendor ID'
                value={''}
                onChange={() => {}}
                required
                className=''
              />
            </div>
            {/*  Agreement Sign Date */}
            <div>
              <label className='block text-xs text-text-subHeading font-medium mb-2 '>
                Agreement Sign Date
              </label>
              <FormDate placeholder='Select Date' onChange={() => {}} value={null} />
            </div>
            {/*  Start From*/}
            <div>
              <label className='block text-xs text-text-subHeading font-medium mb-2 '>
                Start From
              </label>
              <FormDate placeholder='Select Date' onChange={() => {}} value={null} />
            </div>
            {/*  Valid Through */}
            <div>
              <label className='block text-xs text-text-subHeading font-medium mb-2 '>
                Valid Through
              </label>
              <FormDate placeholder='Select Date' onChange={() => {}} value={null} />
            </div>
          </div>
        </section>

        {/*  */}
        <section className='pt-10  bg-white rounded-md pb-5'>
          <div className='border-y  border-gray-200 px-4 pt-3 pb-5 gap-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6'>
            <div className='sm:col-span-2'>
              <label className='text-xs font-semibold '>Element name & Description</label>
              <FormCombobox className='mt-2' placeholder='Search' data={['']} />
            </div>
            <div>
              <label className='text-xs font-semibold '>Code & Category</label>
              <FormCombobox className='mt-2' placeholder='Search' data={['']} />
            </div>
            <div>
              <label className='text-xs font-semibold '>Item Type</label>
              <FormCombobox className='mt-2' placeholder='Search' data={['']} />
            </div>
            <div>
              <label className='text-xs font-semibold '>UOM</label>
              <FormCombobox className='mt-2' placeholder='Search' data={['']} />
            </div>
            <div>
              <label className='text-xs font-semibold '>Contract Rate</label>
              <FormCombobox className='mt-2' placeholder='Search' data={['']} />
            </div>
          </div>
          <button className='ml-5 flex cursor-pointer mt-5  gap-2 items-center '>
            <IconPlus className='size-5' />
            <p className='text-sm font-bold'>Add New Role Contract</p>
          </button>
        </section>

        <section className='p-5 bg-white rounded-md'>
          <button className='flex cursor-pointer  gap-2 items-center '>
            <IconPlus className='size-5' />
            <p className='text-sm font-bold'>Add New Role Contract Document</p>
          </button>
        </section>

        <section className=' bg-white rounded-md'>
          <div className='p-5  border-b border-gray-200'>
            <h6 className='text-sm font-bold'>Payment Term</h6>
          </div>

          <div className='p-5 space-y-3'>
            <div>
              <label className='text-xs font-semibold text-text-subHeading'>Payment Term</label>
              <FormSelect
                className='mt-2 w-[25rem]'
                placeholder='Select Payment Term'
                onChange={() => {}}
                options={[{ label: 'p1', value: 'p1' }]}
                value=''
                required
              />
            </div>
            <div>
              <label className='text-xs font-semibold text-text-subHeading'>
                Other Terms & Condition
              </label>
              <Textarea className='mt-2' placeholder='Write here' rows={7} />
            </div>
          </div>
        </section>

        <Button className='mb-5 !text-sm !font-medium !h-9  ml-auto' radius='full'>
          {' '}
          Create Rate Contract
        </Button>
      </form>
    </div>
  );
}
