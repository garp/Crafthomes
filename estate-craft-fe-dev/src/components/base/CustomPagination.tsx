import { Pagination, type PaginationProps } from '@mantine/core';
import { cn } from '../../utils/helper';
import useUrlSearchParams from '../../hooks/useUrlSearchParams';

export default function CustomPagination({ className, ...props }: PaginationProps) {
  const { setParams, getParam } = useUrlSearchParams();
  function onPagination(currPage: number) {
    setParams('page', (currPage - 1).toString());
  }
  return (
    <Pagination
      value={Number(getParam('page') ?? 0) + 1}
      onChange={onPagination}
      className={cn('mt-auto mx-auto', className)}
      {...props}
    />
  );
}
