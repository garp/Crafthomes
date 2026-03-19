// import { motion } from 'framer-motion';

import type { AddClientSidebarProps } from '../../types/client';

import { toast } from 'react-toastify';
import { useCreateClientMutation } from '../../store/services/client/clientSlice';

import { type TCreateClientFormData } from '../../validators/client';

import type { TErrorResponse } from '../../store/types/common.types';

import SidebarModal from '../base/SidebarModal';
import ClientForm from './ClientForm';
import type { TOnSubmitArgs } from '../../types/common.types';

export const AddClientSidebar = ({
  isOpen,
  onClose,
  onCreated,
  defaultName,
}: AddClientSidebarProps) => {
  const [createClient, { isLoading: isSubmitting }] = useCreateClientMutation();
  const initialValues: TCreateClientFormData = {
    clientType: 'INDIVIDUAL' as 'INDIVIDUAL' | 'ORGANIZATION',
    name: defaultName || '',
    phoneNumber: '',
    email: '',
    panDetails: null,
    addresses: [
      {
        id: null,
        label: '',
        building: '',
        street: '',
        locality: null,
        city: '',
        state: '',
        landmark: null,
        pincode: '',
        country: 'INDIA',
      },
    ],
  };
  // const formik = useFormik({
  //   initialValues: {
  //     name: '',
  //     phoneNumber: '',
  //     email: '',
  //     projectName: '',
  //     startDate: '',
  //     location: '',
  //   },
  //   validationSchema: addClientSchema,
  //   onSubmit: async (values) => {
  //     createClient(values)
  //       .unwrap()
  //       .then(() => {
  //         toast.success('Client added successfully');
  //         formik.resetForm();
  //         onClose();
  //       })
  //       .catch((error: { data: TErrorResponse }) => {
  //         if (error?.data?.message) {
  //           toast.error(error?.data?.message);
  //         } else toast.error('Internal server error');
  //         console.log('Error in creating client:', error);
  //       });
  //   },
  // });
  function handleSubmit({ data, resetForm }: TOnSubmitArgs<TCreateClientFormData>) {
    createClient({
      name: data.name,
      phoneNumber: data.phoneNumber,
      email: data.email,
      clientType: data.clientType,
      panDetails: data.panDetails || null,
      gstIn: data.gstIn,
      addresses: data.addresses?.length
        ? data.addresses.map((addr) => ({
            label: addr.label,
            building: addr.building || null,
            street: addr.street || null,
            locality: addr.locality || null,
            city: addr.city || null,
            state: addr.state || null,
            landmark: addr.landmark || null,
            pincode: addr.pincode || null,
            country: addr.country || null,
          }))
        : undefined,
    })
      .unwrap()
      .then((res: any) => {
        toast.success('Client added successfully');
        const createdId = res?.data?.id || res?.id;
        if (createdId && onCreated) {
          onCreated(createdId);
        }
        resetForm();
        onClose();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Internal server error');
        console.log('Error in creating client:', error);
      });
  }
  // const isFormValid = formik.isValid && formik.dirty;

  return (
    <SidebarModal heading='Add Client' opened={isOpen} onClose={onClose}>
      <ClientForm
        mode='create'
        disabled={isSubmitting}
        initialValues={initialValues}
        onSubmit={handleSubmit}
      />
    </SidebarModal>
  );
};
