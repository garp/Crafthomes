import { Table } from '@mantine/core';
import type { TTableDataProps } from '../../../types/base';
import { cn } from '../../../utils/helper';

export default function TableData({ className, children, colSpan, onClick }: TTableDataProps) {
  return (
    <Table.Td
      colSpan={colSpan}
      className={cn(`text-sm font-medium text-text-subHeading`, className)}
      onClick={onClick}
    >
      {children}
    </Table.Td>
  );
}
