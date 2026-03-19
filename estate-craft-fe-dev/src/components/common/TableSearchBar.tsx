import SearchBar from './SearchBar';
import useUrlSearchParams from '../../hooks/useUrlSearchParams';
import type { TTableSearchBarProps } from '../../types/common.types';
import { cn, debounce } from '../../utils/helper';
import XButton from '../base/button/XButton';
import { useMemo, type ChangeEvent } from 'react';
// import { useState } from 'react';

export default function TableSearchBar({
  query,
  setQuery,
  searchKey = 'query',
  className,
}: TTableSearchBarProps) {
  const { setParams, deleteParams } = useUrlSearchParams();
  const debouncedSearch = useMemo(
    () =>
      debounce((searchValue: string) => {
        if (searchValue.trim()) {
          setParams(searchKey, searchValue);
        } else {
          deleteParams([searchKey]);
        }
      }, 500),
    [setParams, deleteParams, searchKey],
  );

  function onKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    handleSearch();
  }
  function handleSearch() {
    if (query.trim()) {
      setParams(searchKey, query);
    } else {
      deleteParams([searchKey]);
    }
  }
  function handleClearSearch() {
    setQuery('');
    deleteParams([searchKey]);
  }
  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setQuery(newValue);
    debouncedSearch(newValue);
  }
  return (
    <SearchBar
      rightSectionProps={{ onClick: handleClearSearch }}
      leftSectionProps={{ onClick: handleSearch }}
      onKeyUp={onKeyUp}
      value={query}
      onChange={handleInputChange}
      className={cn(``, className)}
      rightSection={query && <XButton />}
    />
  );
}
