// import { useEffect, useRef, useState } from 'react';
// import { debounce } from '../../utils/helper';
// import {
//   useGetProjectTypesQuery,
//   useLazyGetProjectTypesQuery,
// } from '../../store/services/projectType/projectTypeSlice';
// import FormSelect from '../base/FormSelect';
// import type { TProjectTypeFormField } from '../../types/project';

// export default function ProjectTypeFormField({
//   // formik,
//   disabled,
//   defaultSearchValue,
//   setValue,
//   value,
//   error,
//   onBlur,
// }: TProjectTypeFormField) {
//   const [searchValue, setSearchValue] = useState('');
//   const { data: initialProjectTypes } = useGetProjectTypesQuery({ pageLimit: '10' });
//   const [triggerSearchProjectTypes, { data: searchedProjectTypes }] = useLazyGetProjectTypesQuery(
//     {},
//   );
//   const debouncedSearchRef = useRef<ReturnType<typeof debounce> | null>(null);

//   if (!debouncedSearchRef.current) {
//     debouncedSearchRef.current = debounce((q: string) => {
//       if (q.trim()) {
//         triggerSearchProjectTypes({ searchText: q });
//       }
//     }, 500);
//   }

//   const allProjectTypeOptions = initialProjectTypes?.projectTypeData?.map((p) => ({
//     label: p?.name,
//     value: p?.id,
//   })) || [{ label: '', value: '' }];

//   const [options, setOptions] = useState([{ label: '', value: '' }]);

//   useEffect(() => {
//     if (searchedProjectTypes) {
//       setOptions(
//         searchedProjectTypes?.projectTypeData?.map((p) => ({
//           label: p?.name,
//           value: p?.id,
//         })),
//       );
//     }
//   }, [searchedProjectTypes]);

//   useEffect(() => {
//     if (initialProjectTypes) {
//       setOptions(
//         initialProjectTypes?.projectTypeData?.map((p) => ({
//           label: p?.name,
//           value: p?.id,
//         })),
//       );
//     }
//   }, [initialProjectTypes]);

//   return (
//     <FormSelect
//       searchValue={searchValue}
//       defaultSearchValue={defaultSearchValue}
//       required={false}
//       disabled={disabled}
//       name='projectTypeId'
//       placeholder='Select project type'
//       label='Project Type'
//       clearable
//       value={value}
//       onChange={setValue}
//       // onBlur={() => formik.setFieldTouched('projectTypeId', true)}
//       // error={formik.touched.projectTypeId ? formik.errors.projectTypeId : undefined}
//       onDropdownClose={() => setOptions(allProjectTypeOptions)}
//       onSearchChange={(val) => {
//         setSearchValue(val);
//         if (val === '') setOptions(allProjectTypeOptions);
//         if (debouncedSearchRef.current) debouncedSearchRef.current(val);
//       }}
//       options={options}
//       searchable
//       error={error}
//       onBlur={onBlur}
//     />
//   );
// }
