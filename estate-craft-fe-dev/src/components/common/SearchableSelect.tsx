// import { useEffect, useMemo, useRef, useState } from 'react';

// import { cn, debounce } from '../../utils/helper';

// import FormSelect from '../base/FormSelect';
// import {
//   useGetUsersQuery,
//   useLazyGetSearchedUsersQuery,
// } from '../../store/services/user/userSlice';
// import useUrlSearchParams from '../../hooks/useUrlSearchParams';
// import type { TSearchableSelectProps } from '../../types/common.types';

// export default function SearchableSelect({
//   // value,
//   // setSearchValue,
//   // allowFilter = false,
//   setValue,
//   className,
//   error,
//   disabled,
//   allowFilter = false,
//   mapToOptions,
//   ...props
// }: TSearchableSelectProps) {
//   // const [selectValue, setSelectValue] = useState('');
//   const { setParams } = useUrlSearchParams();
//   const { data: initialUsers } = useGetUsersQuery({ pageLimit: '10' });
//   const [triggerSearchUsers, { data: searchedUsers }] = useLazyGetSearchedUsersQuery();
//   const debouncedSearchRef = useRef<ReturnType<typeof debounce> | null>(null);

//   const allUsersOptions = initialUsers?.users?.map((u) => ({ label: u?.name, value: u?.id })) || [
//     { label: '', value: '' },
//   ];

//   const [options, setOptions] = useState([{ label: '', value: '' }]);
//   useEffect(() => {
//     if (searchedUsers) {
//       setOptions(searchedUsers?.users?.map((u) => ({ label: u?.name, value: u?.id })));
//     }
//   }, [searchedUsers]);
//   useEffect(() => {
//     if (initialUsers) {
//       setOptions(initialUsers?.users?.map((u) => ({ label: u?.name, value: u?.id })));
//     }
//   }, [initialUsers]);

//   useEffect(() => {
//     if (!debouncedSearchRef.current) {
//       debouncedSearchRef.current = debounce((q: string) => {
//         if (q.trim()) {
//           triggerSearchUsers({ userName: q });
//         }
//       }, 400);
//     }
//   }, [debouncedSearchRef]);

//   const debouncedSearch = useMemo(
//     () =>
//       debounce((q: string) => {
//         triggerSearchUsers({ userName: q });
//       }, 400),
//     [],
//   );
//   return (
//     <FormSelect
//       {...props}
//       clearable
//       onDropdownClose={() => setOptions(allUsersOptions)}
//       onSearchChange={(val) => {
//         if (val === '') setOptions(allUsersOptions);
//         debouncedSearch(val);
//         // if (debouncedSearchRef.current) debouncedSearchRef.current(val);
//       }}
//       searchable
//       className={cn('w-[20rem]', className)}
//       placeholder='User Name'
//       options={options}
//       onChange={(userId) => {
//         if (allowFilter) setParams('userId', userId);
//         setValue(userId);
//         // if (allowFilter && setSearchValue)
//         // setSearchValue(options.find((o) => o.value === userId)?.label || '');
//       }}
//       error={error}
//       disabled={disabled}
//     />
//   );
// }
