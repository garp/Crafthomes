// import { useEffect, useRef, useState } from 'react';

// import { cn, debounce } from '../../utils/helper';

// import FormSelect from '../base/FormSelect';
// import {
//   useGetUsersQuery,
//   useLazyGetSearchedUsersQuery,
// } from '../../store/services/user/userSlice';
// import useUrlSearchParams from '../../hooks/useUrlSearchParams';
// import type { TUserNameFilterProps } from '../../types/users';

// export default function UserNameFilter({
//   // value,
//   setValue,
//   // setSearchValue,
//   className,
//   allowFilter = false,
//   error,
//   disabled,
//   ...props
// }: TUserNameFilterProps) {
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
//   return (
//     <FormSelect
//       {...props}
//       clearable
//       onDropdownClose={() => setOptions(allUsersOptions)}
//       onSearchChange={(val) => {
//         // if (allowFilter && setSearchValue) setSearchValue(val);
//         if (val === '') setOptions(allUsersOptions);
//         if (debouncedSearchRef.current) debouncedSearchRef.current(val);
//       }}
//       searchable
//       className={cn('w-[20rem]', className)}
//       placeholder='User Name'
//       options={options}
//       onChange={(userId) => {
//         // if (allowFilter && setSearchValue)
//         // setSearchValue(options.find((o) => o.value === userId)?.label || '');
//         if (allowFilter) setParams('userId', userId);
//         setValue(userId);
//       }}
//       error={error}
//       disabled={disabled}
//     />
//   );
// }
