import { Table } from '@mantine/core';
import { cn } from '../../utils/helper';
import TableData from '../base/table/TableData';

type TNotFoundProps = {
  title: string;
  className?: string;
};

export default function NotFoundTextTable({ className, title }: TNotFoundProps) {
  return (
    <Table.Tr className={cn('', className)}>
      <TableData className='text-center ' colSpan={10}>
        {title}
      </TableData>
    </Table.Tr>
  );
}
