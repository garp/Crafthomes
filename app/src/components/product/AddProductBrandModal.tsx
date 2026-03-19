import DialogModal from '../base/ModalWrapper';
import type { TFunc, TOnSubmitArgs } from '../../types/common.types';
import ProductBrandForm from './ProductBrandForm';
import { useCreateProductBrandMutation } from '../../store/services/productBrand/productBrandSlice';
import type { TCreateProductBrandFormData } from '../../validators/productBrand.validator';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../store/types/common.types';

type Props = {
  opened: boolean;
  onClose: TFunc;
};

export default function AddProductBrandModal({ onClose, opened }: Props) {
  const initialValues = {
    name: '',
  };

  const [triggerCreateProductBrand, { isLoading: isCreatingProductBrand }] =
    useCreateProductBrandMutation();

  function onSubmit({ data, resetForm }: TOnSubmitArgs<TCreateProductBrandFormData>) {
    triggerCreateProductBrand(data)
      .unwrap()
      .then(() => {
        toast.success('Brand created successfully');
        resetForm();
        onClose();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) toast.error(error?.data?.message);
        else toast.error('Internal server error');
        console.error('Error Creating Brand:', error);
      });
  }

  return (
    <DialogModal title='Add Brand' size='xl' onClose={onClose} opened={opened}>
      <ProductBrandForm
        initialValues={initialValues}
        mode='create'
        disabled={isCreatingProductBrand}
        onSubmit={onSubmit}
      />
    </DialogModal>
  );
}
