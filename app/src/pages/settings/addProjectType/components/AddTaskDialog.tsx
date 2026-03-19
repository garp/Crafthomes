// import { useState } from 'react';
// import { Button } from '../../../../components';
// import FormInput from '../../../../components/base/FormInput';
// import type { TAddTaskDialogProps } from '../types/types';
// import { useCreateProjectTaskMutation } from '../../../../store/services/projectTask/projectTask';
// import { toast } from 'react-toastify';
// import type { TErrorResponse } from '../../../../store/types/common.types';

// export default function AddTaskDialog({ activePhaseId,disabled }: TAddTaskDialogProps) {
//   const [createProjectTask, { isLoading: isCreatingTask }] = useCreateProjectTaskMutation();
//   const [taskName, setTaskName] = useState('');
//   function handleAddTask() {
//     if (taskName.trim() === '') return;
//     createProjectTask({ name: taskName, phaseId: activePhaseId, description: '' })
//       .unwrap()
//       .then(() => {
//         toast.success('Project Task added successfully');
//       })
//       .catch((error: { data: TErrorResponse }) => {
//         if (error?.data?.message) {
//           toast.error(error?.data?.message);
//         } else toast.error('Internal server error');
//         console.log('Error in creating Project task:', error);
//       });
//   }
//   return (
//     <div className='flex mt-8 items-center gap-5'>
//       <FormInput
//         onChange={(e) => setTaskName(e.target.value)}
//         disabled={isCreatingTask || !activePhaseId}
//         value={taskName}
//         placeholder='Enter Task name'
//         className='w-[30rem]'
//       />
//       <FormInput
//         onChange={(e) => setTaskName(e.target.value)}
//         disabled={isCreatingTask || !activePhaseId}
//         value={taskName}
//         placeholder='Enter Task name'
//         className='w-[30rem]'
//       />
//       <Button
//         onClick={handleAddTask}
//         disabled={disabled || isCreatingTask || !activePhaseId}
//         type='button'
//         className='hover:bg-transparent px-16 bg-transparent  border-[2px] border-gray-500 font-medium !text-black !rounded-full'
//       >
//         Add Task
//       </Button>
//     </div>
//   );
// }
