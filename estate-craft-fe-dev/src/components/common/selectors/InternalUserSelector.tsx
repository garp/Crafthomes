import { useGetUserSettingsQuery } from '../../../store/services/settings/settings';
import SearchSelect from '../SearchSelect';

export type TInternalUserSelectorProps = {
  value: string | null;
  setValue: (id: string | null) => void;
  error?: string;
  disabled?: boolean;
  allowFilter?: boolean;
  defaultSearchValue?: string;
  className?: string;
  inputClassName?: string;
};

export default function InternalUserSelector({ ...props }: TInternalUserSelectorProps) {
  const { data } = useGetUserSettingsQuery({
    pageLimit: 100,
    status: 'ACTIVE',
  });

  // Map internal users to the expected format
  const mappedData = data?.data?.users
    ? { users: data.data.users.map((u) => ({ id: u.id, name: u.name })) }
    : undefined;

  return (
    <SearchSelect
      noOptionsPlaceholder='No internal users available.'
      placeholder='Select User'
      defaultData={mappedData}
      searchedData={undefined}
      onSearch={() => {}}
      mapToOptions={(data) => data?.users?.map((p) => ({ label: p.name, value: p.id })) || []}
      {...props}
    />
  );
}
