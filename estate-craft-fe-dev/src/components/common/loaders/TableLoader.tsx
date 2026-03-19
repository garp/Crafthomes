import { Table } from '@mantine/core';
import BoxJumpLoader from './BoxJumpLoader';
import TableData from '../../base/table/TableData';
import { cn } from '../../../utils/helper';

export default function TableLoader({ className }: { className?: string }) {
  return (
    <Table.Tr className={cn(className)}>
      <TableData colSpan={12}>
        <BoxJumpLoader />
      </TableData>
    </Table.Tr>
  );
}
