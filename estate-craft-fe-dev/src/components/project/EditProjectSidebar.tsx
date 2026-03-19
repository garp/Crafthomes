import { toast } from 'react-toastify';
import { useEditProjectMutation } from '../../store/services/project/projectSlice';
import type { TErrorResponse } from '../../store/types/common.types';

// import { type TCreateProjectFormData } from '../../validators/project';
import SidebarModal from '../../components/base/SidebarModal';
import ProjectForm from './ProjectForm';
import type { TEditFormSidebarProps, TOnSubmitArgs } from '../../types/common.types';
import type { TProject } from '../../store/types/project.types';
import type { TProjectFormInitialValues } from '../../types/project';

export default function EditProjectSidebar({
  isOpen,
  onClose,
  initialData,
}: TEditFormSidebarProps<TProject>) {
  const [editProject, { isLoading: isSubmitting }] = useEditProjectMutation();

  function onSubmit({ data, resetForm }: TOnSubmitArgs<TProjectFormInitialValues>) {
    editProject({ id: initialData?.id || '', ...data })
      .unwrap()
      .then(() => {
        toast.success('Project updated successfully');
        resetForm();
        onClose();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) toast.error(error?.data?.message);
        else toast.error('Unable to update project');
        console.error('Error updating project:', error);
      });
  }
  // Derive project type data from the initialData
  // projectTypes contains { id, name } array from backend (matched from timelines)
  const derivedProjectTypes = initialData?.projectTypes || [];
  const derivedProjectTypeIds = derivedProjectTypes.map((pt) => pt.id);

  const initialValues = {
    name: initialData?.name || '',
    clientId: initialData?.client?.id || null,
    projectTypeGroupId: initialData?.projectTypeGroupId || null,
    projectTypeId: initialData?.projectType?.id || '',
    projectTypeIds: derivedProjectTypeIds.length > 0 ? derivedProjectTypeIds : [],
    masterPhases: initialData?.phases?.map((p) => p?.id) || [],
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    currency: initialData?.currency || 'INR',
    estimatedBudget: initialData?.estimatedBudget || 0,
    startDate: initialData?.startDate ? new Date(initialData?.startDate) : new Date(),
    endDate: initialData?.endDate ? new Date(initialData?.endDate) : null,
    assignProjectManager: initialData?.projectManager?.id || '',
    assignClientContact: Array.isArray((initialData as any)?.assignClientContact)
      ? (initialData as any).assignClientContact
      : (initialData as any)?.assignClientContact
        ? [(initialData as any).assignClientContact]
        : [],
    assignedInternalUsersId: initialData?.projectUsers?.map((u) => u.user?.id || u.userId) || [],
    description:
      (initialData as any)?.description || (initialData as any)?.projectDescription || '',
    attachments: initialData?.attachments || [],
  };

  // Default data for ProjectTypeMultiSelector (timeline templates)
  const defaultProjectTypes = derivedProjectTypes;
  return (
    <SidebarModal heading='Edit Project' opened={isOpen} onClose={onClose}>
      <div className='bg-white'>
        <ProjectForm
          mode='edit'
          disabled={isSubmitting}
          onSubmit={onSubmit}
          initialValues={initialValues}
          defaultClientName={initialData?.client?.name}
          defaultProjectTypes={defaultProjectTypes}
        />
      </div>
    </SidebarModal>
  );
}

// import { toast } from 'react-toastify';
// import { IconX } from '@tabler/icons-react';
// import React, { lazy, Suspense, useEffect } from 'react';
// import { useFormik } from 'formik';
// import { CloseIcon } from '@mantine/core';

// import type { TAttachment, TErrorResponse } from '../../store/types/common.types';
// import type { TCreateProjectFormValues, TEditProjectSidebarProps } from '../../types/project';
// import { createProjectSchema } from '../../validators/project';
// import { useEditProjectMutation } from '../../store/services/project/projectSlice';
// import { useDeleteFileMutation, useUploadFilesMutation } from '../../store/services/upload/upload';
// import { useCities, useCurrencyOptions, useIndianStates } from '../../hooks/useProjectFormOptions';
// import { cn } from '../../utils/helper';

// import DrawerModal from '../base/DrawerModal';
// import FormSelect from '../base/FormSelect';
// import FormDate from '../base/FormDate';
// import FormInput from '../base/FormInput';
// import { Button, Image } from '../base';
// import FormTextArea from '../base/FormTextArea';
// import IconButton from '../base/button/IconButton';
// import { FormFieldSkeleton } from '../base/Skeletons';
// import Spinner from '../common/loaders/Spinner';

// const ProjectManagerSelector = lazy(() => import('./ProjectManagerSelector'));
// const ClientFormField = lazy(() => import('./ClientFormField'));
// const ProjectTypeFormField = lazy(() => import('./ProjectTypeFormField'));
// const ProjectPhaseSelector = lazy(() => import('./ProjectPhaseSelector'));

// const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// export default function EditProjectSidebar({
//   isOpen,
//   onClose,
//   selectedProject,
// }: TEditProjectSidebarProps) {
//   // console.log({ selectedProject });
//   const initialValues = {
//     name: selectedProject?.name ?? '',
//     clientId: selectedProject?.client?.id ?? '',
//     projectTypeId: selectedProject?.projectType?.id ?? '',
//     masterPhases: selectedProject?.projectPhases ?? [],
//     address: selectedProject?.address ?? '',
//     city: selectedProject?.city ?? '',
//     state: selectedProject?.state ?? '',
//     currency: selectedProject?.currency ?? '',
//     estimatedBudget: selectedProject?.estimatedBudget ?? 0,
//     startDate: selectedProject?.startDate ? new Date(selectedProject.startDate) : new Date(),
//     endDate: selectedProject?.endDate ? new Date(selectedProject.endDate) : new Date(),
//     assignProjectManager: selectedProject?.projectManager?.id ?? '',
//     projectDescription: selectedProject?.projectDescription ?? '',
//     attachment: selectedProject?.attachment || [],
//   };
//   console.log({ selectedProject });
//   const [editProject, { isLoading: isEditingProject }] = useEditProjectMutation();
//   const [uploadFiles, { isLoading: isUploadingFiles }] = useUploadFilesMutation();
//   const [deleteFile, { isLoading: isDeletingFile }] = useDeleteFileMutation();
//   // const [attachments, setAttachments] = useState<TAttachment[]>([]);

//   const formik = useFormik<TCreateProjectFormValues>({
//     initialValues,
//     validationSchema: createProjectSchema,
//     onSubmit: async (values, { resetForm }) => {
//       if (!selectedProject?.id) {
//         toast.error('Unable to edit project');
//         return;
//       }
//       editProject({ id: selectedProject?.id, ...values })
//         .unwrap()
//         .then(() => {
//           toast.success('Project updated successfully');
//           resetForm();
//           onClose();
//         })
//         .catch((error: { data: TErrorResponse }) => {
//           toast.error(error?.data?.message || 'Unable to update project');
//           console.log('Error in updating Project:', error);
//         });
//     },
//   });

//   // function patchProject(values: TEditProjectBody, resetForm: () => void) {
//   //   editProject(values)
//   //     .unwrap()
//   //     .then(() => {
//   //       toast.success('Project updated successfully');
//   //       resetForm();
//   //       onClose();
//   //     })
//   //     .catch((error: { data: TErrorResponse }) => {
//   //       toast.error(error?.data?.message || 'Unable to update project');
//   //       console.log('Error in updating Project:', error);
//   //     });
//   // }

//   const currencyOptions = useCurrencyOptions();
//   const indianStates = useIndianStates();
//   const cityOptions = useCities(formik.values.state);
//   const disabled = isEditingProject || isUploadingFiles;

//   function handleAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
//     const files = e.target.files;
//     if (!files) return;
//     if (files?.length > 5 || formik.values.attachment?.length + files.length > 5) {
//       toast.error('Maximum 5 files allowed');
//       return;
//     }
//     const formData = new FormData();
//     for (const file of files) {
//       if (file.size > MAX_FILE_SIZE) {
//         toast.error('File size must be less than 10 MB');
//         return;
//       }
//       formData.append('files', file);
//     }
//     formData.append('folder', 'estatecraft-project-attachments');
//     uploadFiles(formData)
//       .unwrap()
//       .then((res) => {
//         const id = Math.ceil(Math.random() * 10000).toString();
//         const uploadedFiles = res?.data?.files?.map((file) => ({
//           name: file?.name,
//           url: file?.url,
//           id,
//           type: file?.type,
//         }));
//         formik.setFieldValue('attachment', [
//           ...(formik.values.attachment || []),
//           ...uploadedFiles,
//         ]);
//       });
//   }

//   function removeAttachment(attachment: TAttachment) {
//     deleteFile({ key: attachment?.key })
//       .unwrap()
//       .catch((error: { data: TErrorResponse }) => {
//         if (error?.data?.message) {
//           toast.error(error?.data?.message);
//         } else toast.error('Unable to delete file');
//         console.log('Error in deleting file-', error);
//       });
//     formik.setFieldValue(
//       'attachment',
//       formik.values?.attachment?.filter((att) => att.key !== attachment?.key),
//     );
//   }
//   useEffect(() => {
//     if (selectedProject) {
//       formik.setValues(initialValues);
//     }
//   }, [selectedProject]);
//   // console.log({ selectedProject });
//   return (
//     <DrawerModal opened={isOpen} onClose={onClose}>
//       <div className='py-3 px-6 border-b border-gray-200 flex items-center justify-between bg-[#F3F4F7]'>
//         <h2 className='font-semibold text-gray-900'>Update Project</h2>
//         <IconButton onClick={onClose}>
//           <IconX className='size-4 text-text-subHeading' />
//         </IconButton>
//       </div>

//       <form onSubmit={formik.handleSubmit} className='px-6 pt-6 pb-3 flex flex-col h-[92vh]'>
//         <div className='grid grid-cols-2 gap-y-4 gap-x-6 flex-1 overflow-y-auto pr-2 pb-5'>
//           {/* Project name */}
//           <FormInput
//             disabled={disabled}
//             name='name'
//             placeholder='Name of the project'
//             label='Project name*'
//             value={formik.values.name}
//             onChange={formik.handleChange}
//             onBlur={formik.handleBlur}
//             error={formik.touched.name ? formik.errors.name : undefined}
//           />

//           {/* Client */}
//           <Suspense fallback={<FormFieldSkeleton label='Client*' />}>
//             <ClientFormField
//               disabled={disabled}
//               formik={formik}
//               defaultSearchValue={selectedProject?.client?.name}
//             />
//           </Suspense>

//           {/* Project Type */}
//           <Suspense fallback={<FormFieldSkeleton label='Project Type' />}>
//             <ProjectTypeFormField
//               value={formik.values.projectTypeId}
//               setValue={(val) => formik.setFieldValue('projectTypeId', val)}
//               defaultSearchValue={selectedProject?.projectType?.name}
//               setPhases={(value) => formik.setFieldValue('masterPhases', value)}
//               disabled={disabled}
//               // formik={formik}
//               error={formik.touched.projectTypeId ? formik.errors.projectTypeId : undefined}
//               onBlur={() => formik.setFieldTouched('projectTypeId', true)}
//             />
//           </Suspense>

//           {/* Project Phase */}
//           <Suspense fallback={<FormFieldSkeleton label='Project Phases' />}>
//             <ProjectPhaseSelector
//               defaultPhases={selectedProject?.phases.map((p) => ({
//                 id: p?.masterPhaseId,
//                 name: p?.name,
//               }))}
//               projectTypeId={formik.values.projectTypeId}
//               setPhases={(value) => formik.setFieldValue('masterPhases', value)}
//             />
//           </Suspense>

//           {/* Currency */}
//           <FormSelect
//             disabled={disabled}
//             searchable
//             options={currencyOptions}
//             name='currency'
//             placeholder='Enter currency'
//             label='Currency*'
//             value={formik.values.currency}
//             onChange={(val) => formik.setFieldValue('currency', val)}
//             onBlur={formik.handleBlur}
//             error={formik.touched.currency ? formik.errors.currency : undefined}
//           />

//           {/* Estimated Budget */}
//           <FormInput
//             disabled={disabled}
//             name='estimatedBudget'
//             placeholder='Enter project estimation'
//             label='Estimated Budget*'
//             value={formik.values.estimatedBudget}
//             onChange={formik.handleChange}
//             onBlur={formik.handleBlur}
//             error={formik.touched.estimatedBudget ? formik.errors.estimatedBudget : undefined}
//           />

//           {/* State */}
//           <FormSelect
//             disabled={disabled}
//             searchable
//             options={indianStates}
//             name='state'
//             placeholder='Enter state'
//             label='State*'
//             value={formik.values.state}
//             onChange={(val) => {
//               formik.setFieldValue('state', val);
//               formik.setFieldValue('city', null);
//             }}
//             onBlur={formik.handleBlur}
//             error={formik.touched.state ? formik.errors.state : undefined}
//           />

//           {/* City */}
//           <FormSelect
//             disabled={disabled}
//             searchable
//             options={cityOptions}
//             name='city'
//             placeholder='Enter city'
//             label='City*'
//             value={formik.values.city}
//             onChange={(val) => formik.setFieldValue('city', val)}
//             onBlur={formik.handleBlur}
//             error={formik.touched.city ? formik.errors.city : undefined}
//           />

//           {/* Address */}
//           <div className='col-span-2'>
//             <FormInput
//               disabled={disabled}
//               name='address'
//               placeholder='Enter project address'
//               label='Address'
//               value={formik.values.address}
//               onChange={formik.handleChange}
//               onBlur={formik.handleBlur}
//               error={formik.touched.address ? formik.errors.address : undefined}
//             />
//           </div>

//           {/* Start Date */}
//           <FormDate
//             disabled={disabled}
//             name='startDate'
//             placeholder='Project start date'
//             label='Start date*'
//             value={formik.values.startDate}
//             onChange={(val) => formik.setFieldValue('startDate', val)}
//             onBlur={() => formik.setFieldTouched('startDate', true)}
//             error={
//               formik.touched.startDate ? (formik.errors.startDate as string | undefined) : undefined
//             }
//           />

//           {/* End Date */}
//           <FormDate
//             disabled={disabled}
//             name='endDate'
//             placeholder='Completion date'
//             label='Completion date*'
//             value={formik.values.endDate}
//             onChange={(val) => formik.setFieldValue('endDate', val)}
//             onBlur={() => formik.setFieldTouched('endDate', true)}
//             error={
//               formik.touched.endDate ? (formik.errors.endDate as string | undefined) : undefined
//             }
//           />

//           <hr className='col-span-full border mt-2' />

//           {/* Project Manager */}
//           <Suspense fallback={<FormFieldSkeleton label='Assign Project Manager*' />}>
//             <ProjectManagerSelector
//               // formik={formik}
//               defaultSearchValue={selectedProject?.projectManager?.name}
//               allowFilter={false}
//               disabled={disabled}
//               value={formik.values.assignProjectManager}
//               setValue={(val) => formik.setFieldValue('assignProjectManager', val)}
//             />
//           </Suspense>

//           <hr className='col-span-full border mt-2' />

//           {/* Description */}
//           <FormTextArea
//             value={formik.values.description}
//             name='description'
//             onChange={formik.handleChange}
//             placeholder='Enter Description'
//             className='col-span-full'
//             label='Description'
//           />

//           {/* Attachment Upload */}
//           <div className='flex flex-col col-span-2'>
//             <label
//               aria-disabled={disabled}
//               className={cn(
//                 'py-3 text-center text-text-subHeading font-medium border-none bg-neutral-100 w-full',
//                 'aria-disabled:pointer-events-none cursor-pointer aria-disabled:opacity-70 aria-disabled:cursor-not-allowed',
//               )}
//               htmlFor='edit-attachments'
//             >
//               Attachment
//             </label>
//             <input
//               multiple
//               onChange={handleAttachmentChange}
//               type='file'
//               id='edit-attachments'
//               hidden
//             />
//           </div>

//           {/* Attachment details */}
//           <section className=' gap-x-5 gap-y-5 '>
//             {formik.values?.attachment &&
//               formik.values.attachment?.map((attachment) => (
//                 <div key={attachment?.key} className='flex gap-3 items-center'>
//                   {isDeletingFile ? (
//                     <Spinner />
//                   ) : (
//                     <IconButton disabled={disabled} onClick={() => removeAttachment(attachment)}>
//                       <CloseIcon size='16' />
//                     </IconButton>
//                   )}
//                   <div>
//                     {attachment?.type === 'image' ? (
//                       <Image
//                         className='h-16 w-auto object-contain'
//                         src={attachment?.url}
//                         alt={attachment?.name}
//                         height={100}
//                         width={100}
//                       />
//                     ) : (
//                       <span className='text-sm text-gray-600'>{attachment?.name}</span>
//                     )}
//                   </div>
//                 </div>
//               ))}
//           </section>
//         </div>

//         {/* Footer */}
//         <div className='flex justify-end gap-3 mt-6'>
//           <Button
//             disabled={isEditingProject}
//             className='px-7 bg-white'
//             radius='full'
//             type='button'
//             variant='outline'
//             onClick={onClose}
//           >
//             Close
//           </Button>
//           <Button disabled={isEditingProject} radius='full' type='submit'>
//             {isEditingProject ? 'Updating...' : 'Update Project'}
//           </Button>
//         </div>
//       </form>
//     </DrawerModal>
//   );
// }
