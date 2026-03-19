// src/components/common/select/ProductSubCategorySelector.tsx
import { useDisclosure } from '@mantine/hooks';
import type { TBaseSearchSelectorProps } from '../../../constants/common';
import {
  useGetProductSubCategoryQuery,
  useLazyGetProductSubCategoryQuery,
} from '../../../store/services/productSubCategory/productSubCategorySlice';
import AddProductSubCategoryModal from '../../product/AddProductSubCategoryModal';
import SearchSelect from '../SearchSelect';

export type TProductSubCategorySelectorProps = TBaseSearchSelectorProps & {
  categoryId?: string | null;
  brandId?: string;
};

export default function ProductSubCategorySelector({
  name = 'subCategoryId',
  categoryId,
  value,
  allowFilter,
  brandId,
  setValue,
  ...props
}: TProductSubCategorySelectorProps) {
  // If brandId is provided but no categoryId, fetch all subCategories to filter by brand
  const { data } = useGetProductSubCategoryQuery({
    pageLimit: brandId && !categoryId ? '100' : '10',
    categoryId: categoryId || '',
    id: value,
  });
  const [triggerSearchProductSubCategories, { data: searchedSubCategories }] =
    useLazyGetProductSubCategoryQuery();
  const [
    isOpenAddProductSubCategory,
    { open: openAddProductSubCategory, close: closeAddProductSubCategory },
  ] = useDisclosure();

  // Filter subCategories by brandId if provided
  const filteredSubCategories =
    brandId && data?.subCategories
      ? data.subCategories.filter((subCat) => subCat.brandId === brandId)
      : data?.subCategories;

  // Auto-select newly created sub-category
  function handleSubCategoryCreated(id: string) {
    if (setValue) {
      setValue(id);
    }
  }

  return (
    <>
      <SearchSelect
        noOptionsPlaceholder='No Sub-Categories available, add a Sub-Category to get started.'
        placeholder='Select Sub-Category'
        defaultData={
          filteredSubCategories ? { ...data, subCategories: filteredSubCategories } : data
        }
        searchedData={searchedSubCategories}
        onSearch={(q) =>
          triggerSearchProductSubCategories({ search: q, categoryId: categoryId || '' })
        }
        mapToOptions={(data) => {
          const subCats = data?.subCategories || [];
          // Filter by brandId if provided
          const filtered = brandId
            ? subCats.filter((subCat) => subCat.brandId === brandId)
            : subCats;
          return allowFilter
            ? filtered.map((p) => ({ label: p.name, value: p.id }))
            : [
                { label: '+ Add Sub Category', value: 'add' },
                ...filtered.map((p) => ({ label: p.name, value: p.id })),
              ];
        }}
        name={name}
        openAddModal={openAddProductSubCategory}
        value={value}
        setValue={setValue}
        defaultValue={value ? data?.subCategories?.at(0)?.name : undefined}
        allowFilter={allowFilter}
        // defaultSearchValue={data?.subCategories}
        {...props}
      />
      <AddProductSubCategoryModal
        onClose={closeAddProductSubCategory}
        opened={isOpenAddProductSubCategory}
        defaultCategoryId={categoryId || undefined}
        onCreated={handleSubCategoryCreated}
      />
    </>
  );
}
