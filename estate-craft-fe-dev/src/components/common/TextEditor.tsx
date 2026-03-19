'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import { useState } from 'react';
// import { Paperclip, Link as LinkIcon, Smile, ImagePlus, Type } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { AttachmentIcon } from '../icons/AttachmentIcon';
import { LinkIcon } from '../icons/LinkIcon';
import { EmojiIcon } from '../icons/EmojiIcon';
import IconButton from '../base/button/IconButton';
import { TextEditIcon } from '../icons/TextEditIcon';
import TextEditorMenu from './TextEditorMenu';
import { Button } from '../base';
import { IconDotsVertical } from '@tabler/icons-react';
import type { TRichTextEditorProps } from '../../types/common.types';
import AddLinkModal from '../message/AddLinkModal';
import { useDisclosure } from '@mantine/hooks';

export default function TextEditor({
  handleInputChange,
  value,
  isFormValid,
  isSubmitting,
}: TRichTextEditorProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [openedMenu, setOpenedMenu] = useState(false);
  const editor = useEditor({
    extensions: [StarterKit, Underline, Link.configure({ openOnClick: false }), Image],
    content: value,
    onUpdate: ({ editor }) => {
      handleInputChange('message', editor.getHTML()); // update state when user types
    },
  });

  if (!editor) return null;

  return (
    <>
      <div className=' rounded-lg p-2 h-full flex flex-col'>
        {/* Editor */}
        <EditorContent
          // onChange={()}
          placeholder=''
          editor={editor}
          className='min-h-[65vh] border border-gray-200 p-5 rounded-md'
        />

        {/* TOOLBAR */}
        <div className='flex gap-5 mt-auto items-center'>
          <Button
            radius='full'
            disabled={!isFormValid || isSubmitting}
            className='w-fit px-10 !h-9 !text-sm !font-medium border'
          >
            {isSubmitting ? 'Sending...' : 'Send'}
          </Button>
          <div className='flex gap-1 items-center text-gray-600 h-fit'>
            {/* Text formatting */}
            <TextEditorMenu
              withinPortal={false}
              trigger={
                <IconButton type='button'>
                  <TextEditIcon className='size-6' />
                </IconButton>
              }
              editor={editor}
              opened={openedMenu}
              setOpened={setOpenedMenu}
            />
            {/* Emoji */}
            <div className='relative'>
              <IconButton type='button' onClick={() => setShowEmoji(!showEmoji)}>
                <EmojiIcon className=' size-6' />
              </IconButton>
              {showEmoji && (
                <div className='absolute bottom-full z-10'>
                  <EmojiPicker
                    onEmojiClick={(emojiData) =>
                      editor.chain().focus().insertContent(emojiData.emoji).run()
                    }
                  />
                </div>
              )}
            </div>
            {/* File attachment */}
            <label className='cursor-pointer p-2 rounded-full hover:bg-gray-200'>
              <AttachmentIcon className='size-6' />
              <input
                type='file'
                hidden
                onChange={(e) =>
                  e?.target?.files?.[0] && handleInputChange('attachment', e.target.files[0])
                }
              />
            </label>
            {/* Link */}
            <IconButton type='button' onClick={open}>
              <LinkIcon className='size-6' />
            </IconButton>
            <IconButton
              type='button'
              className='cursor-pointer hover:bg-gray-200 rounded-full px-2 py-2'
            >
              <IconDotsVertical className='text-gray-500 size-5' />
            </IconButton>{' '}
          </div>
        </div>
      </div>
      <AddLinkModal editor={editor} opened={opened} close={close} open={open} />
    </>
  );
}

{
  /* <label className='cursor-pointer'>
              <input
                type='file'
                hidden
                accept='image/*'
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    editor
                      .chain()
                      .focus()
                      .setImage({ src: reader.result as string })
                      .run();
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label> */
}
