import type { TBaseSearchSelectorProps } from '../../../constants/common';
import { useGetUnitsQuery, useLazyGetUnitsQuery } from '../../../store/services/unit/unitSlice';
import SearchSelect from '../SearchSelect';

export type TUnitSelectorProps = TBaseSearchSelectorProps & {
  value?: string | null;
};

export default function UnitSelector({ value, allowFilter, ...props }: TUnitSelectorProps) {
  const { data } = useGetUnitsQuery({ pageLimit: '10', id: value || undefined });
  const [triggerSearchUnits, { data: searchedUnits }] = useLazyGetUnitsQuery();

  return (
    <div>
      <SearchSelect
        label='Unit'
        noOptionsPlaceholder={allowFilter ? 'No unit found' : 'No Unit available.'}
        placeholder='Select Unit'
        defaultData={data}
        searchedData={searchedUnits}
        onSearch={(q) => triggerSearchUnits({ search: q })}
        mapToOptions={(data) => data?.units?.map((u) => ({ label: u.name, value: u.id })) || []}
        defaultSearchValue={value ? data?.units?.find((u) => u.id === value)?.name : undefined}
        value={value}
        onCreateFromSearch={undefined}
        {...props}
      />
    </div>
  );
}
