import { Menu } from '@mantine/core';
import type { TMenuModalProps } from '../../types/base';

export default function MenuModal({
  opened,
  setOpened,
  children,
  trigger,
  position,
  withinPortal = false,
}: TMenuModalProps) {
  return (
    <Menu position={position} opened={opened} withinPortal={withinPortal} onChange={setOpened}>
      <Menu.Target>{trigger}</Menu.Target>
      <Menu.Dropdown>{children}</Menu.Dropdown>
    </Menu>
  );
}
