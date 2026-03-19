import {
  useGetProjectTypeGroupsQuery,
  useLazyGetProjectTypeGroupsQuery,
} from '../../../store/services/projectTypeGroup/projectTypeGroupSlice';
import SearchSelect from '../SearchSelect';

export type TProjectTypeGroupSelectorProps = {
  value: string | null;
  setValue: (id: string | null) => void;
  error?: string;
  disabled?: boolean;
  allowFilter?: boolean;
  defaultSearchValue?: string;
  label?: string;
  className?: string;
};

export default function ProjectTypeGroupSelector({
  value,
  ...props
}: TProjectTypeGroupSelectorProps) {
  const { data: defaultData } = useGetProjectTypeGroupsQuery({
    pageLimit: '50',
  });

  const [triggerSearchProjectTypeGroups, { data: searchedData }] =
    useLazyGetProjectTypeGroupsQuery();

  return (
    <SearchSelect
      noOptionsPlaceholder='No Project Type available.'
      placeholder='Select Project Type Group'
      defaultData={defaultData}
      searchedData={searchedData}
      onSearch={(q) =>
        triggerSearchProjectTypeGroups({
          search: q,
          pageLimit: '50',
        })
      }
      mapToOptions={(data) =>
        data?.projectTypeGroups?.map((g) => ({
          label: g.name,
          value: g.id,
        })) || []
      }
      paramKey='projectTypeGroupId'
      value={value}
      {...props}
    />
  );
}
