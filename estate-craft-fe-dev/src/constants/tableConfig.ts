import { createStickyStyle } from './tableStyles';

export const COLUMN_CONFIGS = {
  srNo: { width: '30px', minWidth: '30px' },
  image: { width: '30px', minWidth: '30px' },
  checkbox: { width: '60px', minWidth: '60px' },
  narrow: { width: '80px', minWidth: '80px' },
  number: { width: '140px', minWidth: '140px' },
  standard: { width: '140px', minWidth: '140px' },
  wide: { width: '150px', minWidth: '150px' },
  wider: { width: '160px', minWidth: '160px' },
  widest: { width: '180px', minWidth: '180px' },
  action: { width: '120px', minWidth: '120px' },
} as const;

export const createColumnStyle = (
  config: keyof typeof COLUMN_CONFIGS,
  isSticky?: {
    position: 'left' | 'right';
    offset?: number | string;
    withBorder?: boolean;
    withShadow?: boolean;
  },
) => ({
  ...COLUMN_CONFIGS[config],
  ...(isSticky &&
    createStickyStyle(
      isSticky.position,
      isSticky.offset,
      isSticky.withBorder,
      isSticky.withShadow,
    )),
});

export type ColumnConfigKey = keyof typeof COLUMN_CONFIGS;
