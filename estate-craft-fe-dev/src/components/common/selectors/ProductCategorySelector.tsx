import { useDisclosure } from '@mantine/hooks';
import type { TBaseSearchSelectorProps } from '../../../constants/common';
import {
  useGetProductCategoriesQuery,
  useLazyGetProductCategoriesQuery,
} from '../../../store/services/productCategory/productCategorySlice';
import { useGetProductSubCategoryQuery } from '../../../store/services/productSubCategory/productSubCategorySlice';
import AddProductCategoryModal from '../../product/AddProductCategoryModal';
import SearchSelect from '../SearchSelect';

export type TProductCategorySelectorProps = TBaseSearchSelectorProps & {
  subCategoryId?: string;
  brandId?: string;
};

export default function ProductCategorySelector({
  name = 'categoryId',
  value,
  allowFilter,
  subCategoryId,
  setValue,
  ...props
}: TProductCategorySelectorProps) {
  // const [selectValue, setSelectValue] = useState('');
  const { data } = useGetProductCategoriesQuery({ pageLimit: '10', id: value });
  const [triggerSearchProductCategories, { data: searchedUsers }] =
    useLazyGetProductCategoriesQuery();
  const [
    isOpenAddProductCategory,
    { open: openAddProductCategory, close: closeAddProductCategory },
  ] = useDisclosure(false);

  // Fetch subCategory to get its categoryId if subCategoryId is provided
  const { data: subCategoryData } = useGetProductSubCategoryQuery({
    pageLimit: '1',
    id: subCategoryId || '',
  });

  // If subCategory is selected, filter to show only that subCategory's category
  const filteredCategories =
    subCategoryId && subCategoryData?.subCategories?.[0]?.categoryId && data?.categories
      ? data.categories.filter((cat) => cat.id === subCategoryData.subCategories[0].categoryId)
      : data?.categories;

  // Auto-select newly created category
  function handleCategoryCreated(id: string) {
    if (setValue) {
      setValue(id);
    }
  }

  return (
    <>
      <SearchSelect
        noOptionsPlaceholder='No Categories available, add a Category to get started.'
        placeholder='Select Category'
        defaultData={filteredCategories ? { ...data, categories: filteredCategories } : data}
        searchedData={searchedUsers}
        onSearch={(q) => triggerSearchProductCategories({ search: q })}
        mapToOptions={(data) =>
          allowFilter
            ? data?.categories?.map((p) => ({ label: p.name, value: p.id })) || []
            : [
                { label: '+ Add Category', value: 'add' },
                ...(data?.categories?.map((p) => ({ label: p.name, value: p.id })) || []),
              ]
        }
        name={name}
        openAddModal={openAddProductCategory}
        value={value}
        setValue={setValue}
        defaultValue={value ? data?.categories?.at(0)?.name : undefined}
        allowFilter={allowFilter}
        {...props}
        // paramKey='PhaseId'
      />
      <AddProductCategoryModal
        onClose={closeAddProductCategory}
        opened={isOpenAddProductCategory}
        onCreated={handleCategoryCreated}
      />
    </>
  );
}
