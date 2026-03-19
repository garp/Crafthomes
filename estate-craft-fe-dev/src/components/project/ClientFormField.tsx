// import { useEffect, useRef, useState } from 'react';

// import { debounce } from '../../utils/helper';
// import {
//   useGetClientsQuery,
//   useLazyGetClientsQuery,
// } from '../../store/services/client/clientSlice';
// import FormSelect from '../base/FormSelect';
// import type { TClientFormField } from '../../types/project';

// export default function ClientFormField({
//   formik,
//   disabled,
//   defaultSearchValue,
// }: TClientFormField) {
//   const { data: initialClients } = useGetClientsQuery({ pageLimit: '10' });
//   const [triggerSearchClients, { data: searchedClients }] = useLazyGetClientsQuery({});
//   const debouncedSearchRef = useRef<ReturnType<typeof debounce> | null>(null);

//   if (!debouncedSearchRef.current) {
//     debouncedSearchRef.current = debounce((q: string) => {
//       if (q.trim()) {
//         triggerSearchClients({ searchText: q });
//       }
//     }, 500);
//   }

//   const allClientsOptions = initialClients?.clients?.map((c) => ({
//     label: c?.name,
//     value: c?.id,
//   })) || [{ label: '', value: '' }];

//   const [options, setOptions] = useState([{ label: '', value: '' }]);

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
//       defaultSearchValue={defaultSearchValue}
//       disabled={disabled}
//       name='clientId'
//       placeholder='Select client'
//       label='Client*'
//       clearable
//       value={formik.values.clientId}
//       onChange={(val) => formik.setFieldValue('clientId', val)}
//       onBlur={() => formik.setFieldTouched('clientId', true)}
//       error={formik.touched.clientId ? formik.errors.clientId : undefined}
//       onDropdownClose={() => setOptions(allClientsOptions)}
//       onSearchChange={(val) => {
//         if (val === '') setOptions(allClientsOptions);
//         if (debouncedSearchRef.current) debouncedSearchRef.current(val);
//       }}
//       options={options}
//       searchable
//     />
//   );
// }
