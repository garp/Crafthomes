import {
  useGetPoliciesQuery,
  useLazyGetPoliciesQuery,
} from '../../../store/services/policy/policySlice';
import SearchSelect from '../SearchSelect';

export type TPolicySelectorProps = {
  value: string | null;
  setValue: (id: string | null) => void;
  error?: string;
  disabled?: boolean;
  allowFilter?: boolean;
  defaultSearchValue?: string;
  className?: string;
  inputClassName?: string;
  label?: string;
};

export default function PolicySelector({ ...props }: TPolicySelectorProps) {
  const { data } = useGetPoliciesQuery({ pageLimit: '1000' });
  const [triggerSearchPolicies, { data: searchedPolicies }] = useLazyGetPoliciesQuery();

  return (
    <SearchSelect
      noOptionsPlaceholder='No policies available.'
      placeholder='Select Policy'
      defaultData={data}
      searchedData={searchedPolicies}
      onSearch={(q) => triggerSearchPolicies({ search: q, pageLimit: '1000' })}
      mapToOptions={(data) =>
        data?.policies?.map((p) => ({ label: p.companyName, value: p.id })) || []
      }
      {...props}
    />
  );
}
