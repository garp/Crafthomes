import { toast } from 'react-toastify';
import { useCreateProductMutation } from '../../store/services/product/productSlice';
import type { TCurrency } from '../../store/types/project.types';
import type { TOnSubmitArgs, TSidebarProps } from '../../types/common.types';
import SidebarModal from '../base/SidebarModal';
import ProductForm from './ProductForm';
import type { TCreateProductFormData } from '../../validators/product.validator';
import type { TErrorResponse } from '../../store/types/common.types';

type TAddProductSidebarProps = TSidebarProps & {
  customOnSubmit?: (data: TCreateProductFormData, resetForm: () => void) => Promise<void>;
  isCreating?: boolean;
};

export default function AddProductSidebar({
  isOpen,
  onClose,
  customOnSubmit,
  isCreating: externalIsCreating,
}: TAddProductSidebarProps) {
  const [triggerCreateProduct, { isLoading: isCreatingProduct }] = useCreateProductMutation();
  const isLoading = externalIsCreating !== undefined ? externalIsCreating : isCreatingProduct;
  const initialValues = {
    currency: 'INR' as TCurrency,
    description: '',
    name: '',
    mrp: 0,
    // vendorId: '',
    // mrp: 1,
    // categoryId: '',
    // materialCode: '',
    // material: '',
    // primaryImage: [],
    // materialImage: [],
    // secondaryImage: [],
    // subCategoryId: '',
    // tags: [''],
    // agent: '',
    // adminDescription: '',
    // colorCode: '',
    // costFactor: 1,
    // costPrice: 1,
    // currencyConversionFactor: 1,
  };
  function onSubmit({ data, resetForm }: TOnSubmitArgs<TCreateProductFormData>) {
    if (customOnSubmit) {
      customOnSubmit(data, resetForm).catch((error: { data?: TErrorResponse }) => {
        if (error?.data?.message) toast.error(error.data.message);
        else toast.error('Internal server error');
        console.error('Error creating Product:', error);
      });
      return;
    }

    triggerCreateProduct(data)
      .unwrap()
      .then(() => {
        toast.success('Product created successfully');
        resetForm();
        onClose();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) toast.error(error?.data?.message);
        else toast.error('Internal server error');
        console.error('Error creating Product:', error);
      });
  }
  return (
    <SidebarModal heading='Add Product' onClose={onClose} opened={isOpen}>
      <ProductForm
        disabled={isLoading}
        initialValues={initialValues}
        mode='create'
        onSubmit={onSubmit}
      />
    </SidebarModal>
  );
}
