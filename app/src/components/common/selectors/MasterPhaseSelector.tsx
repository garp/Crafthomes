import {
  useGetMasterPhasesQuery,
  useLazyGetMasterPhasesQuery,
} from '../../../store/services/masterPhase/masterPhase';
import SearchSelect from '../SearchSelect';

export type TMasterPhaseSelectorProps = {
  value: string | null;
  setValue: (id: string | null) => void;
  error?: string;
  disabled?: boolean;
  allowFilter?: boolean;
  defaultSearchValue?: string;
  name?: string;
  className?: string;
};

export default function MasterPhaseSelector({ ...props }: TMasterPhaseSelectorProps) {
  const { data: defaultData } = useGetMasterPhasesQuery({ pageLimit: '10', pageNo: '0' });
  const [triggerSearchPhases, { data: searchedData }] = useLazyGetMasterPhasesQuery();

  return (
    <SearchSelect
      noOptionsPlaceholder='No Masterphase available, add a Masterphase to get started.'
      placeholder='Select Phase'
      defaultData={defaultData}
      searchedData={searchedData}
      onSearch={(q) => triggerSearchPhases({ search: q, pageLimit: '10' })}
      mapToOptions={(data) =>
        data?.masterPhases?.map((p) => ({
          label: p.name,
          value: p.id,
        })) || []
      }
      {...props}
    />
  );
}
