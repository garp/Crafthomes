import { useEffect, useMemo, useRef, useState } from 'react';
import useUrlSearchParams from '../../../../../hooks/useUrlSearchParams';
// import { useLazyGetProjectTasksQuery } from '../../../../../store/services/projectTask/projectTaskSlice';
import { cn, debounce } from '../../../../../utils/helper';
import FormSelect from '../../../../../components/base/FormSelect';
import type { TTaskSelectorProps } from '../types/types';
import { useParams } from 'react-router-dom';
import {
  useGetInfiniteTasksInfiniteQuery,
  useLazyGetProjectTasksQuery,
} from '../../../../../store/services/task/taskSlice';

export default function TaskSelector({
  selectedTask,
  setSelectedTask,
  className,
  allowFilter = true,
  error,
  phaseId,
  disabled,
  setSearchValue,
  assignedToMe = false,
  // defaultSearchValue,
  ...props
}: TTaskSelectorProps & { assignedToMe?: boolean }) {
  const { id } = useParams();
  const { setParams } = useUrlSearchParams();
  const { data: infiniteTasks } = useGetInfiniteTasksInfiniteQuery({
    projectId: id || '',
    phaseId: phaseId || '',
    assignedToMe: assignedToMe || undefined,
  });
  const [triggerSearchTasks, { data: searchedTasks }] = useLazyGetProjectTasksQuery();
  const debouncedSearchRef = useRef<ReturnType<typeof debounce> | null>(null);
  // const [searchValue, setSearchValue] = useState('');

  if (!debouncedSearchRef.current) {
    debouncedSearchRef.current = debounce((q: string) => {
      if (q.trim()) {
        triggerSearchTasks({
          search: q,
          phaseId: phaseId || '',
          assignedToMe: assignedToMe || undefined,
        });
      }
    }, 400);
  }

  const tasksData = useMemo(() => infiniteTasks?.pages?.flatMap((p) => p.tasks), [infiniteTasks]);

  const allTaskOptions = useMemo(
    () => tasksData?.map((t) => ({ label: t?.name, value: t?.id })) || [{ label: '', value: '' }],
    [tasksData],
  );

  const [options, setOptions] = useState([{ label: '', value: '' }]);

  useEffect(() => {
    if (searchedTasks) {
      setOptions(searchedTasks?.tasks?.map((t) => ({ label: t?.name, value: t?.id })));
    }
  }, [searchedTasks]);

  useEffect(() => {
    if (tasksData) {
      setOptions(tasksData?.map((t) => ({ label: t?.name, value: t?.id })));
    }
  }, [tasksData]);

  return (
    <FormSelect
      {...props}
      clearable
      // searchValue={searchValue}
      value={selectedTask}
      onDropdownClose={() => setOptions(allTaskOptions)}
      onSearchChange={(val) => {
        if (setSearchValue) setSearchValue(val);
        if (val === '') setOptions(allTaskOptions);
        if (debouncedSearchRef.current) debouncedSearchRef.current(val);
      }}
      searchable
      className={cn('w-[20rem]', className)}
      placeholder='Task'
      options={options}
      onChange={(taskId) => {
        setSelectedTask(taskId);
        if (setSearchValue) setSearchValue(options.find((o) => o.value === taskId)?.label || '');
        if (allowFilter) setParams('taskId', taskId);
      }}
      error={error}
      disabled={disabled}
    />
  );
}
