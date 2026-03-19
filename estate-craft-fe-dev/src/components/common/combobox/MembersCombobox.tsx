import {
  useGetUsersQuery,
  useLazyGetSearchedUsersQuery,
} from '../../../store/services/user/userSlice';
import SearchableCombobox from '../SearchableCombobox';

export type TMembersComboboxProps = {
  value: string[];
  setValue: (id: string[]) => void;
  error?: string | string[] | undefined;
  disabled?: boolean;
  defaultSearchValue?: string;
  className?: string;
  inputClassName?: string;
  name: string;
  setTouched: (arg: boolean) => void;
  label?: string;
  placeholder?: string;
};

export default function MembersCombobox({
  label = 'Attendees',
  placeholder = 'Select Members',
  ...props
}: TMembersComboboxProps) {
  const { data: usersData } = useGetUsersQuery({ pageLimit: '10', pageNo: '0' });
  const [triggerSearchUsers, { data: searchedUsers, isFetching }] = useLazyGetSearchedUsersQuery();
  return (
    <SearchableCombobox
      label={label}
      placeholder={placeholder}
      initialData={usersData}
      searchedData={searchedUsers}
      onSearch={(q) => triggerSearchUsers({ userName: q })}
      mapToOptions={(data) => data?.users?.map((p) => ({ label: p.name, value: p.id })) || []}
      isSearching={isFetching}
      {...props}
    />
  );
}
