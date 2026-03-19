import {
  useGetProductsQuery,
  useLazyGetProductsQuery,
} from '../../../store/services/product/productSlice';
import SearchableCombobox from '../SearchableCombobox';

export type TProductComboboxProps = {
  value: string[];
  setValue: (id: string[] | null) => void;
  error?: string;
  disabled?: boolean;
  allowFilter?: boolean;
  defaultSearchValue?: string;
  showSelectValue?: boolean;
  name: string;
  setTouched: (arg: boolean) => void;
  showSelectedValues?: boolean;
};

export default function ProductCombobox({ ...props }: TProductComboboxProps) {
  // const [selectValue, setSelectValue] = useState('');
  const { data, isFetching } = useGetProductsQuery({ pageLimit: '10' });
  const [triggerSearchProducts, { data: searchedProducts }] = useLazyGetProductsQuery();

  return (
    <SearchableCombobox
      // label='Attendees'
      placeholder='Select Products'
      initialData={data}
      searchedData={searchedProducts}
      onSearch={(q) => triggerSearchProducts({ search: q })}
      mapToOptions={(data) => data?.masterItems?.map((p) => ({ label: p.name, value: p.id })) || []}
      isSearching={isFetching}
      {...props}
    />
  );
}
