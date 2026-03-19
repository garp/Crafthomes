import { Modal } from '@mantine/core';
import { Editor } from '@tiptap/react';
import { Button, Input } from '../base';
import { useState } from 'react';

type TAddLinkModal = {
  opened: boolean;
  open: () => void;
  close: () => void;
  editor: Editor;
};

export default function AddLinkModal({ close, opened, editor }: TAddLinkModal) {
  const [link, setLink] = useState(editor.getAttributes('link').href);
  function handleAddLink() {
    if (link.trim() === '') return;
    if (link === null) return; // cancelled

    if (link === '') {
      // remove link
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    if (editor.state.selection.empty) {
      // nothing selected → insert link text
      editor.chain().focus().insertContent(`<a href="${link}">${link}</a>`).run();
    } else {
      // text selected → apply link
      editor.chain().focus().extendMarkRange('link').setLink({ href: link }).run();
    }
    setLink('');
    close();
  }
  function handleKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAddLink();
  }
  return (
    <>
      <Modal opened={opened} onClose={close} title='Add link' centered>
        {/* Modal content */}
        <Input
          onKeyUp={handleKeyUp}
          width='100%'
          placeholder='https://estatecraft.com'
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <Button onClick={handleAddLink} className='mt-5'>
          Add
        </Button>
      </Modal>
    </>
  );
}
