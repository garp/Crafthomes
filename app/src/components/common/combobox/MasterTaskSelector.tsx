import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import {
  useGetMasterTasksQuery,
  useLazyGetMasterTasksQuery,
} from '../../../store/services/masterTask/masterTask';
import DraggableCombobox from '../DraggableCombobox';
import type { TOption } from '../../../types/project';

type TMasterTaskSelectorProps = {
  setValue: (val: string[]) => void;
  options: TOption[];
  setOptions: Dispatch<SetStateAction<TOption[]>>;
  defaultData?: { id: string; name: string }[];
  onCreateFromSearch?: (search: string) => void;
  pendingTaskName?: string | null;
  onTaskClick?: (taskId: string) => void;
  projectTypeId?: string;
};

export default function MasterTaskSelector({
  defaultData,
  setOptions,
  setValue,
  onCreateFromSearch,
  pendingTaskName,
  options,
  onTaskClick,
  projectTypeId,
  ...props
}: TMasterTaskSelectorProps) {
  const { data: masterTasks } = useGetMasterTasksQuery({
    pageLimit: '10',
    ...(projectTypeId ? { projectTypeId } : {}),
  });
  const [getSearchedMasterTasks, { data: searchedData, isFetching: isSearchingTasks }] =
    useLazyGetMasterTasksQuery();

  // Track selected task IDs to preserve them across updates
  const selectedTaskIdsRef = useRef<Set<string>>(new Set());

  //setting initial options
  useEffect(() => {
    let filteredTasks = [];
    // Wait for masterTasks to be loaded
    if (!masterTasks?.masterTasks) return;

    // Get currently selected task IDs from ref to preserve them
    const currentlySelectedIds = selectedTaskIdsRef.current;

    // while updating phases when therer are already phases present
    if (defaultData && defaultData.length > 0) {
      const defaults = defaultData?.map((task) => ({
        label: task?.name,
        value: task?.id,
        checked: true,
      }));
      const tasksWhichAreNotInDefault = masterTasks?.masterTasks
        ?.filter((task) => task?.id !== defaults?.find((p) => p.value === task?.id)?.value)
        .map((task) => ({
          label: task?.name,
          value: task?.id,
          checked: currentlySelectedIds.has(task.id), // Preserve if already selected
        }));

      filteredTasks = defaults.concat(tasksWhichAreNotInDefault);
    }
    //while creating new
    else {
      filteredTasks =
        masterTasks?.masterTasks?.map((task) => ({
          label: task?.name,
          value: task?.id,
          checked: currentlySelectedIds.has(task.id), // Preserve if already selected
        })) || [];
    }

    // If we have a pending task name, find and auto-select it
    if (pendingTaskName) {
      const newTask = filteredTasks.find(
        (task) => task.label.toLowerCase() === pendingTaskName.toLowerCase(),
      );
      if (newTask && !newTask.checked) {
        // Mark the new task as checked and add it to selected
        filteredTasks = filteredTasks.map((task) =>
          task.value === newTask.value ? { ...task, checked: true } : task,
        );
        // Update the ref to include the new task
        currentlySelectedIds.add(newTask.value);
      }
    }

    const selectedIds = filteredTasks?.filter((o) => o.checked).map((o) => o.value);
    // Update ref with final selected IDs to preserve them for next update
    selectedTaskIdsRef.current = new Set(selectedIds);

    setOptions(filteredTasks);
    setValue(selectedIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultData, masterTasks, pendingTaskName]);

  // Sync ref when user manually changes selections via the combobox
  // This ensures the ref stays in sync so selections are preserved when masterTasks refetches
  useEffect(() => {
    const checkedIds = new Set(options.filter((opt) => opt.checked).map((opt) => opt.value));
    selectedTaskIdsRef.current = checkedIds;
  }, [options]);
  return (
    <>
      <DraggableCombobox
        options={options}
        // initialData={masterTasks}
        onSearch={(q) =>
          getSearchedMasterTasks({ search: q, ...(projectTypeId ? { projectTypeId } : {}) })
        }
        searchedData={searchedData}
        searchedTotalCount={searchedData?.totalCount || 1}
        disabled={isSearchingTasks}
        onCreateFromSearch={onCreateFromSearch}
        onTaskClick={onTaskClick}
        // mapOptionsExcludingDefault={(data) =>
        //   data?.masterTasks
        //     ?.filter(
        //       (phase) => phase?.id !== defaultData?.find((p) => p.value === phase?.id)?.value,
        //     )
        //     .map((phase) => ({
        //       label: phase?.name,
        //       value: phase?.id,
        //       checked: false,
        //     }))
        // }
        mapToOptions={(data) =>
          data?.masterTasks?.map((task) => ({
            name: task?.name,
            id: task?.id,
          })) || []
        }
        setValue={setValue}
        setOptions={setOptions}
        label='Select Tasks'
        //default data(used while updating)
        // defaultData={defaultData}
        {...props}
      />
    </>
  );
}
