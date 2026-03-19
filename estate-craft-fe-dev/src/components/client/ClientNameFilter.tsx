// import { useEffect, useRef, useState } from 'react';

// import FormSelect from '../base/FormSelect';

// import { cn, debounce } from '../../utils/helper';
// import {
//   useGetClientsQuery,
//   useLazyGetClientsQuery,
// } from '../../store/services/client/clientSlice';
// import type { TClientNameFilterProps } from '../../types/client';
// // import useUrlSearchParams from '../../hooks/useUrlSearchParams';

// export default function ClientNameFilter({
//   // selectedClientName,
//   // setSelectedClientName,
//   className,
//   // allowFilter = true,
//   // searchValue,
//   // setSearchValue,
//   setValue,
//   ...props
// }: TClientNameFilterProps) {
//   // const [selectValue, setSelectValue] = useState('');
//   // const { setParams } = useUrlSearchParams();
//   const { data: initialClients } = useGetClientsQuery({ pageLimit: '10' });
//   const [triggerSearchClients, { data: searchedClients }] = useLazyGetClientsQuery({});
//   const debouncedSearchRef = useRef<ReturnType<typeof debounce> | null>(null);

//   // if (!debouncedSearchRef.current) {
//   //   debouncedSearchRef.current = debounce((q: string) => {
//   //     if (q.trim()) {
//   //       triggerSearchClients({ searchText: q });
//   //     }
//   //   }, 500);
//   // }

//   const allClientsOptions = initialClients?.clients?.map((c) => ({
//     label: c?.name,
//     value: c?.id,
//   })) || [{ label: '', value: '' }];

//   const [options, setOptions] = useState([{ label: '', value: '' }]);

//   useEffect(() => {
//     if (!debouncedSearchRef.current) {
//       debouncedSearchRef.current = debounce((q: string) => {
//         if (q.trim()) {
//           triggerSearchClients({ searchText: q });
//         }
//       }, 500);
//     }
//   }, [debouncedSearchRef]);

//   useEffect(() => {
//     if (searchedClients) {
//       setOptions(searchedClients?.clients?.map((c) => ({ label: c?.name, value: c?.id })));
//     }
//   }, [searchedClients]);

//   useEffect(() => {
//     if (initialClients) {
//       setOptions(initialClients?.clients?.map((c) => ({ label: c?.name, value: c?.id })));
//     }
//   }, [initialClients]);

//   return (
//     <FormSelect
//       {...props}
//       // searchValue={searchValue}
//       clearable
//       onDropdownClose={() => setOptions(allClientsOptions)}
//       onSearchChange={(val) => {
//         // if (setSearchValue) setSearchValue(val);
//         if (val === '') setOptions(allClientsOptions);
//         if (debouncedSearchRef.current) debouncedSearchRef.current(val);
//       }}
//       searchable
//       className={cn(`w-[20rem]`, className)}
//       placeholder='Client Name'
//       onChange={(clientId) => {
//         // if (setSearchValue) setSearchValue(options.find((o) => o.value === clientId)?.label || '');
//         // if (allowFilter) setParams('clientId', clientId);
//         // else
//         setValue(clientId);
//         // else
//       }}
//       options={options}
//     />
//   );
// }
