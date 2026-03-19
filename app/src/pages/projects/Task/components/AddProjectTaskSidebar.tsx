// import { IconX } from '@tabler/icons-react';
// import FormSelect from '../../../../components/base/FormSelect';
// import { Button } from '../../../../components/base';
// import { useFormik } from 'formik';

// import DrawerModal from '../../../../components/base/DrawerModal';
// import type { TAddProjectTaskSidebarProps } from '../types/types';
// import {
//   assigneeOptions,
//   durationOptions,
//   priorityOptions,
//   unitOptions,
// } from '../constants/constants';
// import FormDate from '../../../../components/base/FormDate';
// import FormLabel from '../../../../components/base/FormLabel';
// import FormTextArea from '../../../../components/base/FormTextArea';
// import PlusCircle from '../../../../components/icons/PlusCircle';

// export const AddProjectTaskSidebar = ({ isOpen, onClose }: TAddProjectTaskSidebarProps) => {
//   // const [creatUser, { isLoading }] = useCreateUserMutation();
//   const formik = useFormik({
//     initialValues: {
//       taskName: '',
//       startDate: new Date(),
//       endDate: new Date(),
//       duration: '',
//       assignee: '',
//       unit: '',
//       notes: '',
//       attachment: undefined,
//       priority: '',
//     },
//     // Add validationSchema if needed
//     onSubmit: async () => {
//       // Handle Submit
//     },
//   });
//   const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files) {
//       formik.setFieldValue('attachment', e.target.files);
//     }
//   };

//   const isFormValid = formik.isValid && formik.dirty;
//   return (
//     <DrawerModal opened={isOpen} onClose={onClose}>
//       {/* Header */}
//       <div className='h-screen flex flex-col'>
//         <div className='py-3 px-6 border-b border-gray-200 flex items-center justify-between bg-[#F3F4F7]'>
//           <h2 className=' font-semibold text-gray-900'>Create Task</h2>
//           <button onClick={onClose} className='p-1 rounded-md hover:bg-gray-100 transition-colors'>
//             <IconX className='size-4 text-text-subHeading' />
//           </button>
//         </div>
//         {/* Form */}
//         <form onSubmit={formik.handleSubmit} className='px-6 pt-6 pb-3 gap-6 h-full flex flex-col '>
//           <FormTextArea
//             placeholder='Type Task name here'
//             name='taskName'
//             value={formik.values.taskName}
//             onChange={formik.handleChange}
//             onBlur={formik.handleBlur}
//             className='w-full'
//             error={
//               formik.touched.taskName && formik.errors.taskName ? formik.errors.taskName : undefined
//             }
//           />
//           {/* <FormInput
//             placeholder='Type Task name here'
//             name='taskName'
//             value={formik.values.taskName}
//             onChange={formik.handleChange}
//             onBlur={formik.handleBlur}
//             className='w-full'
//             error={
//               formik.touched.taskName && formik.errors.taskName ? formik.errors.taskName : undefined
//             }
//           /> */}

//           {/* Start - End Date */}
//           <div className='flex items-center'>
//             <FormLabel className='w-[40%]'>Start-End Date</FormLabel>
//             <div className='w-[60%] flex gap-2'>
//               <FormDate
//                 required
//                 placeholder='Start Date'
//                 name='startDate'
//                 value={formik.values.startDate}
//                 onChange={(date) => formik.setFieldValue('startDate', date)}
//                 onBlur={() => formik.setFieldTouched('startDate', true)}
//                 className='w-full'
//                 error={
//                   formik.touched.startDate && formik.errors.startDate
//                     ? String(formik.errors.startDate)
//                     : undefined
//                 }
//               />
//               <FormDate
//                 required
//                 placeholder='End Date'
//                 name='endDate'
//                 value={formik.values.endDate}
//                 onChange={(date) => formik.setFieldValue('endDate', date)}
//                 onBlur={() => formik.setFieldTouched('endDate', true)}
//                 className='w-full'
//                 error={
//                   formik.touched.endDate && formik.errors.endDate
//                     ? String(formik.errors.endDate)
//                     : undefined
//                 }
//               />
//             </div>
//           </div>

//           {/* Duration */}
//           <div className='flex'>
//             <FormLabel className='w-[40%]'>Duration</FormLabel>
//             <FormSelect
//               required
//               placeholder='Duration'
//               name='duration'
//               value={formik.values.duration}
//               onChange={(val) => formik.setFieldValue('duration', val || '')}
//               onBlur={() => formik.setFieldTouched('duration', true)}
//               options={durationOptions}
//               className='w-[60%]'
//               error={
//                 formik.touched.duration && formik.errors.duration
//                   ? formik.errors.duration
//                   : undefined
//               }
//             />
//           </div>

//           {/* Assignee */}
//           <div className='flex'>
//             <FormLabel className='w-[40%]'>Assignee</FormLabel>
//             <FormSelect
//               required
//               placeholder='Select a Member'
//               name='assignee'
//               value={formik.values.assignee}
//               onChange={(val) => formik.setFieldValue('assignee', val || '')}
//               onBlur={() => formik.setFieldTouched('assignee', true)}
//               options={assigneeOptions}
//               className='w-[60%]'
//               error={
//                 formik.touched.assignee && formik.errors.assignee
//                   ? formik.errors.assignee
//                   : undefined
//               }
//             />
//           </div>
//           {/* Unit of Measurement */}
//           <div className='flex '>
//             <FormLabel className='w-[40%]'>Member</FormLabel>
//             <FormSelect
//               placeholder='Select a Unit'
//               name='unit'
//               value={formik.values.unit}
//               onChange={(val) => formik.setFieldValue('unit', val || '')}
//               onBlur={() => formik.setFieldTouched('unit', true)}
//               options={unitOptions}
//               className='w-[60%]'
//               error={formik.touched.unit && formik.errors.unit ? formik.errors.unit : undefined}
//             />
//           </div>

//           {/* Notes */}
//           <div className='flex gap-2'>
//             <FormLabel className='w-[40%]'>Notes</FormLabel>
//             <FormTextArea
//               placeholder='Add Note'
//               name='notes'
//               value={formik.values.notes}
//               onChange={formik.handleChange}
//               onBlur={formik.handleBlur}
//               error={formik.touched.notes && formik.errors.notes ? formik.errors.notes : undefined}
//               className='w-[60%]'
//             />
//           </div>

//           {/* Attachment */}
//           <div className='flex'>
//             <FormLabel className='w-[40%]'>Attachment</FormLabel>
//             <label
//               htmlFor='attachment'
//               className='cursor-pointer px-5 py-3 border border-gray-300 rounded inline-block'
//             >
//               <PlusCircle />
//             </label>
//             <input
//               type='file'
//               id='attachment'
//               name='attachment'
//               onChange={handleAttachmentChange}
//               className='hidden'
//             />
//           </div>

//           {/* Priority */}
//           <div className='flex'>
//             <FormLabel className='w-[40%]'>Priority</FormLabel>
//             <FormSelect
//               placeholder='Select Priority'
//               name='priority'
//               value={formik.values.priority}
//               onChange={(val) => formik.setFieldValue('priority', val || '')}
//               onBlur={() => formik.setFieldTouched('priority', true)}
//               options={priorityOptions}
//               className='w-[60%]'
//               error={
//                 formik.touched.priority && formik.errors.priority
//                   ? formik.errors.priority
//                   : undefined
//               }
//             />
//           </div>

//           <Button
//             radius='full'
//             type='submit'
//             disabled={!isFormValid}
//             className='!text-sm mt-auto ml-auto'
//           >
//             Submit Task
//             {/* {isSubmitting ? 'Submitting...' : 'Submit Task'} */}
//           </Button>
//         </form>
//       </div>

//       {/* </motion.div> */}
//     </DrawerModal>
//   );
// };
