import { useState } from 'react';
import { Button } from '../../../components';
import TableSearchBar from '../../../components/common/TableSearchBar';
import AddProductSidebar from '../../../components/product/AddProductSidebar';
import ProductCategorySelector from '../../../components/common/selectors/ProductCategorySelector';
import ProductSubCategorySelector from '../../../components/common/selectors/ProductSubCategorySelector';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import ClearFilterButton from '../../../components/base/button/ClearFilterButton';
import ProductBrandSelector from '../../../components/common/selectors/ProductBrandSelector';
import IconButton from '../../../components/base/button/IconButton';

import { IconDotsVertical } from '@tabler/icons-react';
import MenuModal from '../../../components/base/MenuModal';
import { toast } from 'react-toastify';

export default function ProductManagementHeader() {
  const [query, setQuery] = useState('');
  const [isOpenProductSidebar, setIsOpenProductSidebar] = useState(false);
  const { setParams, deleteParams, getParam } = useUrlSearchParams();

  const categoryId = getParam('categoryId');
  const subCategoryId = getParam('subCategoryId');
  const brandId = getParam('brandId');

  function handleClearFilters() {
    deleteParams(['categoryId', 'subCategoryId', 'globalQuery', 'brandId', 'query']);
    setQuery('');
  }

  return (
    <>
      <div className='flex md:flex-row flex-col justify-between  gap-5'>
        <div className='flex gap-5 flex-wrap'>
          <TableSearchBar query={query} setQuery={setQuery} />
          <ProductCategorySelector
            className='w-44'
            value={categoryId}
            allowFilter
            setValue={(val) => setParams('categoryId', val)}
            subCategoryId={subCategoryId || undefined}
            brandId={brandId || undefined}
          />
          <ProductSubCategorySelector
            categoryId={categoryId || null}
            className='w-44'
            value={subCategoryId}
            allowFilter
            setValue={(val) => setParams('subCategoryId', val)}
            brandId={brandId || undefined}
          />
          <ProductBrandSelector
            className='w-44'
            value={brandId}
            allowFilter
            setValue={(val) => setParams('brandId', val)}
            categoryId={categoryId || undefined}
            subCategoryId={subCategoryId || undefined}
          />
          <ClearFilterButton onClick={handleClearFilters} />
        </div>
        <div className='flex items-center gap-3'>
          <Button onClick={() => setIsOpenProductSidebar(true)} radius='full' className='w-fit'>
            Add Product
          </Button>
          <MenuModal
            trigger={
              <IconButton>
                <IconDotsVertical />
              </IconButton>
            }
          >
            <ProductMenu />
          </MenuModal>
        </div>
      </div>
      <AddProductSidebar
        isOpen={isOpenProductSidebar}
        onClose={() => setIsOpenProductSidebar(false)}
      />
    </>
  );
}

function ProductMenu() {
  const menuItems = [
    {
      title: 'Categories',
      href: '/',
    },
    {
      title: 'Sub-Categories',
      href: '/',
    },
    {
      title: 'Brands',
      href: '/',
    },
  ];
  return (
    <ul className='list-inside '>
      {menuItems?.map((item) => (
        <li className='hover:bg-bg-light pl-4 pr-8 py-2'>
          <div className='text-sm cursor-pointer' onClick={() => toast.info('Under development')}>
            {item?.title}
          </div>
        </li>
      ))}
    </ul>
  );
}
