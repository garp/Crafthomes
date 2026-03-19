import { useMemo } from 'react';
import { useDisclosure } from '@mantine/hooks';
import type { TBaseSearchSelectorProps } from '../../../constants/common';
import {
  useGetProductBrandsQuery,
  useLazyGetProductBrandsQuery,
} from '../../../store/services/productBrand/productBrandSlice';
import { useGetProductSubCategoryQuery } from '../../../store/services/productSubCategory/productSubCategorySlice';
import AddProductBrandModal from '../../product/AddProductBrandModal';
import SearchSelect from '../SearchSelect';

export type TProductBrandSelectorProps = TBaseSearchSelectorProps & {
  categoryId?: string;
  subCategoryId?: string;
};

export default function ProductBrandSelector({
  name = 'brandId',
  allowFilter,
  categoryId,
  subCategoryId,
  ...props
}: TProductBrandSelectorProps) {
  const { data } = useGetProductBrandsQuery({ pageLimit: '10' });
  const [triggerSearchProductBrands, { data: searchedBrands }] = useLazyGetProductBrandsQuery();

  // Fetch subCategory to get its brandId if subCategoryId is provided
  const { data: subCategoryData } = useGetProductSubCategoryQuery({
    pageLimit: '1',
    id: subCategoryId || '',
    categoryId: categoryId || '',
  });

  // Fetch all subCategories of the category to get their brandIds if categoryId is provided
  const { data: categorySubCategoriesData } = useGetProductSubCategoryQuery({
    pageLimit: categoryId && !subCategoryId ? '100' : '1',
    categoryId: categoryId || '',
  });

  const [isOpenAddProductBrand, { open: openAddProductBrand, close: closeAddProductBrand }] =
    useDisclosure(false);

  // Get unique brandIds from subCategories when category is selected
  const categoryBrandIds = useMemo(() => {
    if (categoryId && !subCategoryId && categorySubCategoriesData?.subCategories) {
      return new Set(
        categorySubCategoriesData.subCategories
          .map((subCat) => subCat.brandId)
          .filter((brandId): brandId is string => Boolean(brandId)),
      );
    }
    return null;
  }, [categoryId, subCategoryId, categorySubCategoriesData]);

  // Filter brands based on selections
  const filteredBrands = useMemo(() => {
    if (!data?.brands) return undefined;

    let brands = data.brands;

    // If subCategory is selected, show only that subCategory's brand
    if (subCategoryId && subCategoryData?.subCategories?.[0]?.brandId) {
      brands = brands.filter((brand) => brand.id === subCategoryData.subCategories[0].brandId);
    }
    // If category is selected (but not subCategory), show only brands that exist in subCategories of that category
    else if (categoryId && !subCategoryId && categoryBrandIds) {
      brands = brands.filter((brand) => categoryBrandIds.has(brand.id));
    }

    return brands;
  }, [data?.brands, subCategoryId, subCategoryData, categoryId, categoryBrandIds]);

  return (
    <>
      <SearchSelect
        noOptionsPlaceholder='No Brands available, add a Brand to get started.'
        placeholder='Select Brand'
        defaultData={filteredBrands ? { ...data, brands: filteredBrands } : data}
        searchedData={searchedBrands}
        onSearch={(q) => triggerSearchProductBrands({ search: q })}
        mapToOptions={(data) => {
          const brands = data?.brands || [];
          // Apply the same filtering logic as defaultData
          let filtered = brands;

          if (subCategoryId && subCategoryData?.subCategories?.[0]?.brandId) {
            filtered = brands.filter(
              (brand) => brand.id === subCategoryData.subCategories[0].brandId,
            );
          } else if (categoryId && !subCategoryId && categoryBrandIds) {
            filtered = brands.filter((brand) => categoryBrandIds.has(brand.id));
          }

          return allowFilter
            ? filtered.map((b) => ({ label: b.name, value: b.id }))
            : [
                { label: '+ Add Brand', value: 'add' },
                ...filtered.map((b) => ({ label: b.name, value: b.id })),
              ];
        }}
        name={name}
        openAddModal={openAddProductBrand}
        allowFilter={allowFilter}
        {...props}
      />
      <AddProductBrandModal onClose={closeAddProductBrand} opened={isOpenAddProductBrand} />
    </>
  );
}
