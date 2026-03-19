// import { useFormik } from 'formik';
// import { motion } from 'framer-motion';

import type { EditClientSidebarProps } from '../../types/client';
// import { IconX } from '@tabler/icons-react';
import { toast } from 'react-toastify';

import { type TCreateClientFormData } from '../../validators/client';
// import { projectOptions } from '../../pages/clients/constants/constants';
// import { Button } from '../base';
// import FormInput from '../base/FormInput';
// import FormSelect from '../base/FormSelect';
// import FormDate from '../base/FormDate';
import { useEditClientMutation } from '../../store/services/client/clientSlice';

import type { TErrorResponse } from '../../store/types/common.types';
// import DrawerModal from '../base/DrawerModal';
// import FormLabel from '../base/FormLabel';
import SidebarModal from '../base/SidebarModal';
import ClientForm from './ClientForm';
import type { TOnSubmitArgs } from '../../types/common.types';

export default function EditClientSidebar({
  isOpen,
  onClose,
  // clientId,
  clientData,
}: EditClientSidebarProps) {
  const [editClient, { isLoading: isSubmitting }] = useEditClientMutation();
  const initialValues = {
    clientType: clientData?.clientType || 'INDIVIDUAL',
    name: clientData?.name || '',
    phoneNumber: clientData?.phoneNumber || '',
    email: clientData?.email || '',
    panDetails: clientData?.panDetails || null,
    gstIn: clientData?.gstIn || '',
    addresses:
      clientData?.addresses?.map((addr) => ({
        id: addr.id || '',
        label: addr.label,
        building: addr.building || '',
        street: addr.street || '',
        locality: addr.locality || '',
        city: addr.city || '',
        state: addr.state || '',
        landmark: addr.landmark || '',
        pincode: addr.pincode || '',
        country: addr.country || 'INDIA',
      })) || [],
  };
  // const formik = useFormik({
  //   initialValues: {
  //     name: clientData?.name || '',
  //     phoneNumber: clientData?.phoneNumber || '',
  //     email: clientData?.email || '',
  //     projectId: clientData?.projectId || '',
  //     startDate: clientData?.startDate ? new Date(clientData?.startDate) : new Date(),
  //     location: clientData?.location || '',
  //   },
  //   validationSchema: addClientSchema,
  //   onSubmit: async (values) => {
  //     if (!clientData) {
  //       toast.error('Unable to update client, please try again later.');
  //       console.log('Client data is undefined');
  //       return;
  //     }
  //     editClient({
  //       ...values,
  //       clientId: clientData?.id,
  //     })
  //       .unwrap()
  //       .then(() => {
  //         toast.success('Client updated successfully');
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
    if (!clientData) {
      toast.error('Unable to update client, please try again later.');
      console.log('Client data is undefined');
      return;
    }
    editClient({
      name: data.name,
      phoneNumber: data.phoneNumber,
      email: data.email,
      clientType: data.clientType,
      panDetails: data.panDetails || null,
      gstIn: data.gstIn,
      addresses: data.addresses?.map((addr) => ({
        id: addr.id || undefined,
        label: addr.label,
        building: addr.building || null,
        street: addr.street || null,
        locality: addr.locality || null,
        city: addr.city || null,
        state: addr.state || null,
        landmark: addr.landmark || null,
        pincode: addr.pincode || null,
        country: addr.country || null,
      })),
      clientId: clientData?.id,
    })
      .unwrap()
      .then(() => {
        toast.success('Client updated successfully');
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
    <SidebarModal heading='Edit Client' opened={isOpen} onClose={onClose}>
      <ClientForm
        mode='edit'
        disabled={isSubmitting}
        initialValues={initialValues}
        onSubmit={handleSubmit}
      />
    </SidebarModal>
  );
}
