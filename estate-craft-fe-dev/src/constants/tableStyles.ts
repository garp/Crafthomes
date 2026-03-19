export const TABLE_STYLES = {
  backgroundColor: '#ffffff',
  stickyLeft: {
    position: 'sticky' as const,
    left: 0,
    zIndex: 10,
    backgroundColor: '#ffffff',
    boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
  },
  stickyRight: {
    position: 'sticky' as const,
    zIndex: 10,
    backgroundColor: '#ffffff',
    boxShadow: '-2px 0 6px rgba(0, 0, 0, 0.15)',
  },
  stickyRightLight: {
    position: 'sticky' as const,
    zIndex: 10,
    backgroundColor: '#ffffff',
    boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.1)',
  },
} as const;

export const createStickyStyle = (
  position: 'left' | 'right',
  offset: number | string = 0,
  withBorder = false,
  withShadow = true,
) => {
  const baseStyle = TABLE_STYLES[position === 'left' ? 'stickyLeft' : 'stickyRight'];

  return {
    ...baseStyle,
    [position]: offset,
    ...(withBorder && { borderLeft: '1px solid #d1d5db' }),
    ...(withShadow ? {} : { boxShadow: 'none' }),
  };
};
