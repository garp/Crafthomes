import { IconBold, IconItalic, IconUnderline } from '@tabler/icons-react';
import type { TTExtEditoMenu } from '../../types/base';
import MenuModal from '../base/MenuModal';
import { Menu } from '@mantine/core';

export default function TextEditorMenu({
  opened,
  setOpened,
  editor,
  trigger,
  withinPortal,
}: TTExtEditoMenu) {
  return (
    <MenuModal
      position='bottom-start'
      withinPortal={withinPortal}
      trigger={trigger}
      opened={opened}
      setOpened={setOpened}
    >
      <Menu.Dropdown>
        <Menu.Item onClick={() => editor.chain().focus().toggleBold().run()}>
          <IconBold />
        </Menu.Item>
        <Menu.Item onClick={() => editor.chain().focus().toggleItalic().run()}>
          <IconItalic />
        </Menu.Item>
        <Menu.Item onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <IconUnderline />
        </Menu.Item>
      </Menu.Dropdown>
    </MenuModal>
  );
}
