import { Drawer } from '@mantine/core';

import type { TDrawerModalProps } from '../../types/base';

export default function DrawerModal({
  opened,
  onClose,
  position = 'right',
  children,
  className,
  size = '600px',
  zIndex,
}: TDrawerModalProps) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title=''
      position={position}
      className={className}
      size={size}
      zIndex={zIndex}
      styles={{
        content: {
          padding: 0,
        },
        header: {
          display: 'none',
        },
        body: {
          padding: 0,
          height: '100%',
        },
      }}
    >
      {children}
    </Drawer>
  );
}
