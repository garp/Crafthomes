import { toast } from 'react-toastify';
import { useEditProductMutation } from '../../store/services/product/productSlice';
import type { TOnSubmitArgs, TSidebarProps } from '../../types/common.types';
import SidebarModal from '../base/SidebarModal';
import ProductForm from './ProductForm';
import type { TCreateProductFormData } from '../../validators/product.validator';
import type { TErrorResponse } from '../../store/types/common.types';
import type { TProduct } from '../../store/types/product.types';

type TEditProductSidebarProps = TSidebarProps & {
  productData: TProduct | null;
};

export default function EditProductSidebar({
  isOpen,
  onClose,
  productData,
}: TEditProductSidebarProps) {
  const [triggerUpdateProduct, { isLoading: isUpdatingProduct }] = useEditProductMutation();
  console.log({ productData });
  function onSubmit({ data, resetForm }: TOnSubmitArgs<TCreateProductFormData>) {
    if (!productData?.id) {
      toast.error('Unable to create Product');
      console.log('Product id is undefined/null');
      return;
    }
    triggerUpdateProduct({ id: productData?.id, ...data })
      .unwrap()
      .then(() => {
        toast.success('Product updated successfully');
        resetForm();
        onClose();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) toast.error(error?.data?.message);
        else toast.error('Internal server error');
        console.error('Error updating product:', error);
      });
  }
  return (
    <SidebarModal heading='Edit Product' onClose={onClose} opened={isOpen}>
      <ProductForm
        disabled={isUpdatingProduct}
        initialValues={{
          ...(productData || { name: '', description: '', currency: 'INR', mrp: 0 }),
          vendorId: productData?.vendor?.id,
          categoryId: productData?.category?.id,
          subCategoryId: productData?.subCategory?.id,
          unitId: productData?.unit?.id,
        }}
        defaultVendorName={productData?.vendor?.name}
        // defaultCategoryName=''
        mode='edit'
        onSubmit={onSubmit}
        // defaultVendorName={data?.}
        // defaultCategoryName={productData}
      />
    </SidebarModal>
  );
}
