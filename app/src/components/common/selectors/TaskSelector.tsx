import { useEffect } from 'react';
import {
  useGetProjectTasksQuery,
  useLazyGetProjectTasksQuery,
} from '../../../store/services/task/taskSlice';

import SearchSelect from '../SearchSelect';

export type TTaskSelectorProps = {
  value: string | null;
  setValue: (id: string | null) => void;
  error?: string;
  disabled?: boolean;
  allowFilter?: boolean;
  defaultSearchValue?: string;
  projectId?: string;
  phaseId?: string;
  assignedToMe?: boolean;
};

export default function TaskSelector({
  phaseId,
  projectId,
  assignedToMe,
  ...props
}: TTaskSelectorProps) {
  // const [selectValue, setSelectValue] = useState('');
  const { data } = useGetProjectTasksQuery(
    { pageLimit: '10', projectId, phaseId, assignedToMe: assignedToMe || undefined },
    {
      skip: !projectId || !phaseId,
    },
  );
  const [triggerSearchTasks, { data: searchedTasks }] = useLazyGetProjectTasksQuery();

  useEffect(() => {
    if (projectId) {
      triggerSearchTasks({
        search: '',
        projectId,
        pageLimit: '10',
        assignedToMe: assignedToMe || undefined,
      });
    }
  }, [projectId, triggerSearchTasks, assignedToMe]);

  return (
    <SearchSelect
      noOptionsPlaceholder='No Tasks available, add a Task to get started.'
      placeholder='Select Task'
      defaultData={data}
      searchedData={searchedTasks}
      onSearch={(q) =>
        triggerSearchTasks({
          search: q,
          projectId,
          pageLimit: '10',
          assignedToMe: assignedToMe || undefined,
        })
      }
      mapToOptions={(data) => data?.tasks?.map((p) => ({ label: p?.name, value: p?.id })) || []}
      {...props}
    />
  );
}
