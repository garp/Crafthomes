import ProductManagementHeader from './ProductManagementHeader';
import ProductTable from './ProductsTable';

export default function ProductPage() {
  return (
    <div className='flex flex-col gap-5 mt-5 h-full'>
      <ProductManagementHeader />
      <ProductTable />
    </div>
  );
}
