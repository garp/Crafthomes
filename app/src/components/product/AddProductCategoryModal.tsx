import DialogModal from '../base/ModalWrapper';
import type { TFunc, TOnSubmitArgs } from '../../types/common.types';
import ProductCategoryForm from './ProductCategoryForm';
import { useCreateProductCategoryMutation } from '../../store/services/productCategory/productCategorySlice';
import type { TCreateProductCategoryFormData } from '../../validators/productCategory.validator';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../store/types/common.types';

type Props = {
  opened: boolean;
  onClose: TFunc;
  onCreated?: (id: string) => void;
};

export default function AddProductCategoryModal({ onClose, opened, onCreated }: Props) {
  const initialValues = {
    name: '',
    description: '',
    icon: [],
  };
  const [triggerCreateProductCategory, { isLoading: isCreatingProduct }] =
    useCreateProductCategoryMutation();
  function onSubmit({ data, resetForm }: TOnSubmitArgs<TCreateProductCategoryFormData>) {
    triggerCreateProductCategory(data)
      .unwrap()
      .then((res) => {
        toast.success('Category created successfully');
        resetForm();
        // Auto-select the newly created category
        const createdId = res?.data?.id || (res as { id?: string })?.id;
        if (onCreated && createdId) {
          onCreated(createdId);
        }
        onClose();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) toast.error(error?.data?.message);
        else toast.error('Internal server error');
        console.error('Error Creating Category:', error);
      });
  }
  return (
    <DialogModal title='Add Category' size={'xl'} onClose={onClose} opened={opened}>
      <ProductCategoryForm
        initialValues={initialValues}
        mode='create'
        disabled={isCreatingProduct}
        onSubmit={onSubmit}
      />
    </DialogModal>
  );
}
