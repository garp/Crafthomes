import { useGetPhasesQuery, useLazyGetPhasesQuery } from '../../../store/services/phase/phaseSlice';
import SearchSelect from '../SearchSelect';

export type TPhaseSelectorProps = {
  value: string | null;
  setValue: (id: string | null) => void;
  error?: string;
  disabled?: boolean;
  allowFilter?: boolean;
  defaultSearchValue?: string;
  timelineId?: string;
  projectId?: string;
  // passthrough styling props for SearchSelect
  className?: string;
  inputClassName?: string;
};

export default function PhaseSelector({
  setValue,
  value,
  timelineId,
  projectId,
  ...props
}: TPhaseSelectorProps) {
  const canLoadPhases = Boolean(timelineId || projectId);
  const { data } = useGetPhasesQuery(
    { pageLimit: '10', pageNo: '0', timelineId, projectId },
    { skip: !canLoadPhases },
  );
  const [triggerSearchPhases, { data: searchedPhases }] = useLazyGetPhasesQuery();

  return (
    <SearchSelect
      noOptionsPlaceholder={
        !canLoadPhases
          ? 'Select a timeline first'
          : 'No Phase available, add a Phase to get started.'
      }
      placeholder={!canLoadPhases ? 'Select Timeline first' : 'Select Phase'}
      value={value}
      setValue={setValue}
      defaultData={data}
      searchedData={searchedPhases}
      onSearch={(q) => triggerSearchPhases({ search: q, pageLimit: '10', timelineId, projectId })}
      mapToOptions={(data) => data?.phases?.map((p) => ({ label: p.name, value: p.id })) || []}
      disabled={!canLoadPhases ? true : props.disabled}
      {...props}
    />
  );
}
