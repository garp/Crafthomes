import DialogModal from '../base/ModalWrapper';
import type { TFunc, TOnSubmitArgs } from '../../types/common.types';
import type { TCreateProductSubCategoryFormData } from '../../validators/productSubCategory.validator';
import ProductSubCategoryForm from './ProductSubCategoryForm';
import { useCreateProductSubCategoryMutation } from '../../store/services/productSubCategory/productSubCategorySlice';
import { toast } from 'react-toastify';
import type { TErrorResponse } from '../../store/types/common.types';

type Props = {
  opened: boolean;
  onClose: TFunc;
  defaultCategoryId?: string;
  onCreated?: (id: string) => void;
};

export default function AddProductSubCategoryModal({
  onClose,
  opened,
  defaultCategoryId,
  onCreated,
}: Props) {
  const subCategoryInitialValues: TCreateProductSubCategoryFormData = {
    name: '',
    categoryId: defaultCategoryId || '',
  };
  const [triggerCreateProductCategory, { isLoading: isCreatingProductSubCategory }] =
    useCreateProductSubCategoryMutation();
  function onSubmit({ data, resetForm }: TOnSubmitArgs<TCreateProductSubCategoryFormData>) {
    triggerCreateProductCategory(data)
      .unwrap()
      .then((res) => {
        toast.success('Sub-Category created successfully');
        resetForm();
        // Auto-select the newly created sub-category

        const createdId = res?.data?.id || (res?.data as any)?.subCategory?.id || (res as any)?.id;
        if (onCreated && createdId) {
          onCreated(createdId);
        }
        onClose();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) toast.error(error?.data?.message);
        else toast.error('Internal server error');
        console.error('Error Creating Sub-Category:', error);
      });
  }

  return (
    <DialogModal title='Add Sub-Category' size={'xl'} onClose={onClose} opened={opened}>
      <ProductSubCategoryForm
        initialValues={subCategoryInitialValues}
        mode='create'
        disabled={isCreatingProductSubCategory}
        onSubmit={onSubmit}
      />
    </DialogModal>
  );
}
