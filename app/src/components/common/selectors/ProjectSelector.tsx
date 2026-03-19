import {
  useGetProjectsQuery,
  useLazyGetProjectsQuery,
} from '../../../store/services/project/projectSlice';
import SearchSelect from '../SearchSelect';
import type { TProjectSelectorProps } from '../../../types/common.types';

export default function ProjectSelector({ ...props }: TProjectSelectorProps) {
  const { data: defaultData } = useGetProjectsQuery({ pageLimit: '10', pageNo: '0' });
  const [triggerSearchProjects, { data: searchedData }] = useLazyGetProjectsQuery();

  return (
    <SearchSelect
      noOptionsPlaceholder='No Projects available, add a Project to get started.'
      placeholder='Select Project'
      defaultData={defaultData}
      searchedData={searchedData}
      onSearch={(q) => triggerSearchProjects({ search: q, pageLimit: '10' })}
      mapToOptions={(data) =>
        data?.projects?.map((p) => ({
          label: p.name,
          value: p.id,
        })) || []
      }
      paramKey='projectId'
      {...props}
    />
  );
}
