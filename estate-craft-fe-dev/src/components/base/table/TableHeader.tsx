import { Table, Checkbox, Text } from '@mantine/core';
import { createColumnStyle, type ColumnConfigKey } from '../../../constants/tableConfig';

interface CheckboxHeaderProps {
  isSticky?: boolean;
  offset?: number | string;
}

interface TextHeaderProps {
  children: string;
  config?: ColumnConfigKey;
  isSticky?: {
    position: 'left' | 'right';
    offset?: number | string;
    withBorder?: boolean;
    withShadow?: boolean;
  };
  className?: string;
}

export const CheckboxHeader = ({ isSticky = false, offset = 0 }: CheckboxHeaderProps) => (
  <Table.Th
    style={createColumnStyle('checkbox', isSticky ? { position: 'left', offset } : undefined)}
  >
    <Checkbox color='var(--color-primary-100)' />
  </Table.Th>
);

export const TextHeader = ({
  children,
  config = 'standard',
  isSticky,
  className = 'h-11',
}: TextHeaderProps) => (
  <Table.Th style={createColumnStyle(config, isSticky)} className={className}>
    <Text size='sm' fw={600} c='#232323' className='font-inter text-nowrap'>
      {children}
    </Text>
  </Table.Th>
);
