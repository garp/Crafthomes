import type { TAddUserSidebarProps } from '../../types/users';

import { type TAddUserFormData } from '../../validators/user';
import { useCreateUserMutation } from '../../store/services/user/userSlice';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../store/types/common.types';
import SidebarModal from '../base/SidebarModal';
import { UserForm } from './UserForm';

export const AddUserSidebar = ({ isOpen, onClose }: TAddUserSidebarProps) => {
  const [createUser, { isLoading: isSubmitting }] = useCreateUserMutation();
  function onSubmit(values: TAddUserFormData, resetForm: () => void) {
    createUser(values)
      .unwrap()
      .then(() => {
        toast.success('User added successfully');
        resetForm();
        onClose();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Internal server error');
        console.log('Error in creating user:', error);
      });
  }
  return (
    <SidebarModal heading='Add User' opened={isOpen} onClose={onClose}>
      <div className=' bg-white'>
        <UserForm
          mode='add'
          disabled={isSubmitting}
          onSubmit={onSubmit}
          initialValues={{
            name: '',
            phoneNumber: '',
            email: '',
            department: '',
            password: '',
            designationId: '',
            roleId: '',
            clientId: '',
            vendorId: '',
          }}
        />
      </div>
    </SidebarModal>
  );
};
// <form
//   onSubmit={formik.handleSubmit}
//   className='px-6 pt-6 pb-3 space-y-6 flex flex-col h-[92vh] '
// >
//   <div className='space-y-6'>
//     {/* Name */}
//     <div className='flex items-center'>
//       <label className='block text-sm font-medium mb-2 w-[40%]'>Name</label>
//       <div className='w-[60%]'>
//         <FormInput
//           disabled={isSubmitting}
//           placeholder='Enter Name'
//           name='name'
//           value={formik.values.name}
//           onChange={formik.handleChange}
//           onBlur={formik.handleBlur}
//           className='w-full'
//           error={formik.touched.name && formik.errors.name ? formik.errors.name : undefined}
//         />
//       </div>
//     </div>
//     {/* Phone Number */}
//     <div className='flex items-center'>
//       <label className='block text-sm font-medium mb-2 w-[40%]'>Phone Number</label>
//       <div className='w-[60%]'>
//         <FormInput
//           disabled={isSubmitting}
//           placeholder='Enter Phone Number'
//           name='phoneNumber'
//           value={formik.values.phoneNumber}
//           onChange={formik.handleChange}
//           onBlur={formik.handleBlur}
//           className='w-full'
//           error={
//             formik.touched.phoneNumber && formik.errors.phoneNumber
//               ? formik.errors.phoneNumber
//               : undefined
//           }
//         />
//       </div>
//     </div>
//     {/* Email ID */}
//     <div className='flex items-center'>
//       <label className='block text-sm font-medium mb-2 w-[40%]'>Email ID</label>
//       <div className='w-[60%]'>
//         <FormInput
//           disabled={isSubmitting}
//           placeholder='Enter Email ID'
//           type='email'
//           name='email'
//           value={formik.values.email}
//           onChange={formik.handleChange}
//           onBlur={formik.handleBlur}
//           className='w-full'
//           error={
//             formik.touched.email && formik.errors.email ? formik.errors.email : undefined
//           }
//         />
//       </div>
//     </div>
//     {/* PASSWORD */}
//     <div className='flex items-center'>
//       <label className='block text-sm font-medium mb-2 w-[40%]'>Password</label>
//       <div className='w-[60%]'>
//         <FormInput
//           disabled={isSubmitting}
//           placeholder='Enter Password'
//           name='password'
//           value={formik.values.password}
//           onChange={formik.handleChange}
//           onBlur={formik.handleBlur}
//           className='w-full'
//           error={
//             formik.touched.password && formik.errors.password
//               ? formik.errors.password
//               : undefined
//           }
//         />
//       </div>
//     </div>
//     {/* Role */}
//     <div className='flex items-center'>
//       <label className='block text-sm font-medium mb-2 w-[40%]'>Role</label>
//       <FormSelect
//         disabled={isLoadingRoles || isSubmitting}
//         placeholder='Select Role'
//         name='roleId'
//         value={formik.values.roleId}
//         onChange={(value) => formik.setFieldValue('roleId', value || '')}
//         onBlur={() => formik.setFieldTouched('roleId', true)}
//         options={parseSnakeCase(roleOptions)}
//         className='w-[60%]'
//         error={
//           formik.touched.roleId && formik.errors.roleId ? formik.errors.roleId : undefined
//         }
//       />
//     </div>
//     {/* Department */}
//     <div className='flex items-center'>
//       <label className='block text-sm font-medium mb-2 w-[40%]'>Department</label>
//       <div className='w-[60%]'>
//         <FormSelect
//           disabled={isSubmitting}
//           placeholder='Select Department'
//           name='department'
//           value={formik.values.department}
//           onChange={(value) => formik.setFieldValue('department', value || '')}
//           onBlur={() => formik.setFieldTouched('department', true)}
//           options={projectOptions}
//           className='w-full'
//           error={
//             formik.touched.department && formik.errors.department
//               ? formik.errors.department
//               : undefined
//           }
//         />
//       </div>
//     </div>
//     {/* Designation */}
//     <div className='flex items-center'>
//       <label className='block text-sm font-medium mb-2 w-[40%]'>Designation</label>
//       <div className='w-[60%]'>
//         <FormInput
//           disabled={isSubmitting}
//           placeholder='Designation'
//           name='designation'
//           value={formik.values.designation}
//           onChange={(e) => formik.setFieldValue('designation', e.target.value || '')}
//           onBlur={() => formik.setFieldTouched('designation', true)}
//           // options={projectOptions}
//           className='w-full'
//           error={
//             formik.touched.designation && formik.errors.designation
//               ? formik.errors.designation
//               : undefined
//           }
//         />
//       </div>
//     </div>

//     {/* Start Date */}
//     <div className='flex items-center'>
//       <label className='block text-sm font-medium mb-2 w-[40%]'>Start Date</label>
//       <div className='w-[60%]'>
//         <div className='flex pr-3 border items-center border-[#D1D5DB] w-full rounded-[6px]'>
//           <DateInput
//             disabled={isSubmitting}
//             placeholder='Select Date'
//             name='startDate'
//             value={formik.values.startDate}
//             onChange={(date) => formik.setFieldValue('startDate', date)}
//             onBlur={() => formik.setFieldTouched('startDate', true)}
//             className='w-full border-none'
//             classNames={{ input: 'placeholder:font-medium' }}
//             styles={{
//               input: {
//                 paddingTop: '21px',
//                 paddingBottom: '21px',
//                 fontSize: '14px',
//                 border: 'none',
//                 '&:focus': {
//                   boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
//                 },
//               },
//             }}
//             error={
//               formik.touched.startDate && formik.errors.startDate
//                 ? formik.errors.startDate
//                 : undefined
//             }
//           />
//           <IconCalendarWeek className='text-gray-500' />
//         </div>
//       </div>
//     </div>
//     {/* Location */}
//     <div className='flex items-center'>
//       <label className='block text-sm font-medium text-gray-700 mb-2 w-[40%]'>Location</label>
//       <div className='w-[60%]'>
//         <FormInput
//           disabled={isSubmitting}
//           placeholder='Enter Location'
//           name='location'
//           value={formik.values.location}
//           onChange={formik.handleChange}
//           onBlur={formik.handleBlur}
//           className='w-full'
//           error={
//             formik.touched.location && formik.errors.location
//               ? formik.errors.location
//               : undefined
//           }
//         />
//       </div>
//     </div>
//   </div>
//   {/* Submit Button */}
//   <Button
//     type='submit'
//     disabled={!isFormValid || isSubmitting}
//     className='!text-sm mt-auto ml-auto'
//   >
//     {isSubmitting ? 'Adding...' : 'Invite'}
//   </Button>
// </form>;
