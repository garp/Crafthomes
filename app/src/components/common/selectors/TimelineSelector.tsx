import {
  useGetProjectTimelineQuery,
  useLazyGetProjectTimelineQuery,
} from '../../../store/services/projectTimeline/projectTimelineSlice';
import SearchSelect from '../SearchSelect';

export type TTimelineSelectorProps = {
  value: string | null;
  setValue: (id: string | null) => void;
  error?: string;
  disabled?: boolean;
  allowFilter?: boolean;
  defaultSearchValue?: string;
  className?: string;
  inputClassName?: string;
  label?: string;
  projectId?: string;
  skip?: boolean;
};

export default function TimelineSelector({ projectId, skip, ...props }: TTimelineSelectorProps) {
  const { data } = useGetProjectTimelineQuery({ pageLimit: '10', projectId }, { skip });
  const [triggerSearchTimelines, { data: searchedTimelines }] = useLazyGetProjectTimelineQuery();

  return (
    <SearchSelect
      noOptionsPlaceholder='No Timelines available, add a Timeline to get started.'
      placeholder='Select Timeline'
      defaultData={data}
      searchedData={searchedTimelines}
      onSearch={(q) => triggerSearchTimelines({ search: q, projectId })}
      mapToOptions={(data) => data?.timelines?.map((p) => ({ label: p.name, value: p.id })) || []}
      {...props}
      // paramKey='PhaseId'
    />
  );
}
