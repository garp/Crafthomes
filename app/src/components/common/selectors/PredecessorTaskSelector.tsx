import { useEffect } from 'react';
import {
  useGetProjectTasksQuery,
  useLazyGetProjectTasksQuery,
} from '../../../store/services/task/taskSlice';
import SearchableCombobox from '../SearchableCombobox';
import type { TTask } from '../../../store/types/task.types';

export type TPredecessorTaskSelectorProps = {
  value: string[];
  setValue: (ids: string[]) => void;
  error?: string;
  disabled?: boolean;
  projectId?: string;
  phaseId?: string;
  currentTaskId?: string; // Exclude current task from options
  className?: string;
};

export default function PredecessorTaskSelector({
  projectId,
  currentTaskId,
  value,
  setValue,
  ...props
}: TPredecessorTaskSelectorProps) {
  const { data } = useGetProjectTasksQuery(
    { pageLimit: '100', projectId },
    {
      skip: !projectId,
    },
  );

  const [triggerSearchTasks, { data: searchedTasks, isFetching: isSearching }] =
    useLazyGetProjectTasksQuery();

  useEffect(() => {
    if (projectId) {
      triggerSearchTasks({ search: '', projectId, pageLimit: '100' });
    }
  }, [projectId, triggerSearchTasks]);

  // Filter out current task from options
  const filterTasks = (tasks: TTask[] | undefined) => {
    if (!tasks) return [];
    return tasks.filter((task) => task.id !== currentTaskId);
  };

  return (
    <SearchableCombobox<{ tasks: TTask[]; totalCount: number }>
      value={value}
      setValue={setValue}
      placeholder='Select Predecessor Tasks'
      name='predecessorTaskIds'
      label='Predecessor Tasks'
      initialData={data ? { ...data, tasks: filterTasks(data.tasks) } : undefined}
      searchedData={
        searchedTasks ? { ...searchedTasks, tasks: filterTasks(searchedTasks.tasks) } : undefined
      }
      onSearch={(q) => triggerSearchTasks({ search: q, projectId, pageLimit: '100' })}
      mapToOptions={(data) =>
        filterTasks(data?.tasks).map((task) => ({ label: task.name, value: task.id })) || []
      }
      isSearching={isSearching}
      setTouched={() => {}}
      {...props}
    />
  );
}
