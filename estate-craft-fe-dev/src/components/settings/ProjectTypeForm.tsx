import { Form, Formik } from 'formik';

import { Button } from '../../components/base';
import FormLabel from '../../components/base/FormLabel';
import FormInput from '../../components/base/FormInput';
import {
  createProjectTypeSchema,
  type TCreateProjectTypeFormData,
} from '../../validators/projectType';
import { useDisclosure } from '@mantine/hooks';
import AddEditMasterPhaseSidebar from './AddEditMasterPhaseSidebar';
import ProjectPhaseSelector from './ProjectPhaseSelector';
import { useState, useRef, useCallback } from 'react';
import type { TOption } from '../../types/project';
import { useLazyGetMasterPhasesQuery } from '../../store/services/masterPhase/masterPhase';
import type { TMasterPhase } from '../../store/types/masterPhase.types';
// import CustomCheckbox from '../../components/base/CustomCheckbox';
// import { useGetMasterPhasesQuery } from '../../store/services/masterPhase/mastertPhase';
// import ProjectType from './ProjectType';
// import type { TMasterPhase } from '../../store/types/masterPhase.types';

type TProjectTypeFormProps = {
  //   onSuccess?: () => void;
  //   onOpenAddPhase: () => void;
  //   onOpenAddTask: () => void;
  onSubmit: (data: TCreateProjectTypeFormData, resetForm: () => void) => void;
  initialValues: TCreateProjectTypeFormData;
  disabled: boolean;
  defaultPhases?: { id: string; name: string }[];
};

export default function ProjectTypeForm({
  initialValues,
  onSubmit,
  disabled,
  defaultPhases,
}: TProjectTypeFormProps) {
  const [options, setOptions] = useState<TOption[]>([]);
  // Track the phase name that was just created via sidebar, so it can be auto-selected
  const [pendingPhaseName, setPendingPhaseName] = useState<string | null>(null);
  const [isOpenAddPhaseSidebar, { open: openAddPhaseSidebar, close: closeAddPhaseSidebar }] =
    useDisclosure(false);
  const [isOpenEditPhaseSidebar, { open: openEditPhaseSidebar, close: closeEditPhaseSidebar }] =
    useDisclosure(false);
  const [selectedPhaseData, setSelectedPhaseData] = useState<TMasterPhase | null>(null);
  const [initialPhaseName, setInitialPhaseName] = useState<string | undefined>(undefined);
  const [getPhaseById] = useLazyGetMasterPhasesQuery();

  // Use ref to store setFieldValue so we can create a stable setPhases callback
  const setFieldValueRef = useRef<((field: string, value: any) => void) | null>(null);

  // Stable callback for setting phases
  const setPhases = useCallback((val: string[]) => {
    if (setFieldValueRef.current) {
      setFieldValueRef.current('phases', val);
    }
  }, []);

  // Stable callback for handling pending phase
  const handlePendingPhaseHandled = useCallback(() => {
    setPendingPhaseName(null);
  }, []);

  // Callback when a new phase is created via sidebar
  function handlePhaseCreated(phaseName: string) {
    setPendingPhaseName(phaseName);
    setInitialPhaseName(undefined); // Clear initial name after creation
  }

  // Handle create from search
  function handleCreateFromSearch(phaseName: string) {
    setPendingPhaseName(phaseName);
    setInitialPhaseName(phaseName);
    openAddPhaseSidebar();
  }

  // Handle phase click to edit
  async function handlePhaseClick(phaseId: string) {
    try {
      const result = await getPhaseById({ id: phaseId }).unwrap();
      const phase = result?.masterPhases?.[0];
      if (phase) {
        setSelectedPhaseData(phase);
        openEditPhaseSidebar();
      }
    } catch (error) {
      console.error('Error fetching phase:', error);
    }
  }

  // Handle phase update - update the options state with new name
  function handlePhaseUpdated(phaseId: string, newName: string) {
    setOptions((prev) =>
      prev.map((opt) => (opt.value === phaseId ? { ...opt, label: newName } : opt)),
    );
  }
  return (
    <>
      <Formik<TCreateProjectTypeFormData>
        initialValues={initialValues}
        onSubmit={(data, { resetForm }) => {
          onSubmit(data, resetForm);
          setOptions((opts) => opts.map((o) => ({ ...o, checked: false })));
        }}
        validationSchema={createProjectTypeSchema}
        enableReinitialize
      >
        {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => {
          // Update ref whenever setFieldValue changes
          setFieldValueRef.current = setFieldValue;

          return (
            <Form className='mt-5 flex gap-8 flex-col h-full w-full'>
              {/* Project Type Name */}
              <section>
                <FormLabel htmlFor='projectType'>Project Type Name</FormLabel>
                <FormInput
                  disabled={disabled}
                  name='name'
                  className='mt-2 w-120'
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.name && errors.name ? errors.name : undefined}
                  placeholder='Enter project type name'
                />
              </section>
              <ProjectPhaseSelector
                options={options}
                setOptions={setOptions}
                defaultPhases={defaultPhases}
                setPhases={setPhases}
                error={touched.phases ? errors.phases : undefined}
                pendingPhaseName={pendingPhaseName}
                onPendingPhaseHandled={handlePendingPhaseHandled}
                onCreateFromSearch={handleCreateFromSearch}
                onPhaseClick={handlePhaseClick}
              />
              <div className='flex mt-8 items-center justify-between'>
                <Button
                  onClick={openAddPhaseSidebar}
                  disabled={disabled}
                  type='button'
                  radius='full'
                  variant='outline'
                  className='hover:bg-transparent bg-transparent border-2 border-gray-500 px-8'
                >
                  Add New Phase
                </Button>
                {/* Submit */}
                <Button
                  disabled={disabled}
                  type='submit'
                  radius='full'
                  className='font-medium px-12'
                >
                  {disabled ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </Form>
          );
        }}
      </Formik>

      <AddEditMasterPhaseSidebar
        isOpen={isOpenAddPhaseSidebar}
        onClose={() => {
          closeAddPhaseSidebar();
          setInitialPhaseName(undefined); // Clear initial name when closing
        }}
        onSuccess={handlePhaseCreated}
        mode='create'
        initialPhaseName={initialPhaseName}
      />
      <AddEditMasterPhaseSidebar
        isOpen={isOpenEditPhaseSidebar}
        onClose={closeEditPhaseSidebar}
        phaseData={selectedPhaseData}
        mode='edit'
        onPhaseUpdated={handlePhaseUpdated}
      />
    </>
  );
}
// function handlePhaseCheckbox(e: React.ChangeEvent<HTMLInputElement>, phase: TMasterPhase) {
//   let filteredPhases = formik.values?.phases || [];
//   if (e.target.checked) {
//     filteredPhases.push(phase?.id);
//   } else {
//     filteredPhases = filteredPhases.filter((p) => p !== phase?.id);
//   }
//   formik.setFieldValue('phases', filteredPhases);
// }
