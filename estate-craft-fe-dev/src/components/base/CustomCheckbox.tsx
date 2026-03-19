import { Checkbox, type CheckboxProps } from '@mantine/core';

type Props = CheckboxProps & {
  color?: string;
  labelColor?: string;
  labelFontWeight?: number;
};

export default function CustomCheckbox({
  color = 'dark',
  labelColor = '#6b6b6b',
  labelFontWeight = 500,
  ...props
}: Props) {
  return (
    <Checkbox
      onClick={(e) => e.stopPropagation()}
      color={color}
      className='cursor-pointer'
      styles={{
        label: {
          color: labelColor,
          fontWeight: labelFontWeight,
          fontSize: 12,
        },
      }}
      {...props}
    />
  );
}
