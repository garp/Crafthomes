import { RichTextEditor } from '@mantine/tiptap';
import { Editor } from '@tiptap/react';
import { type ChangeEvent, useState } from 'react';
import '@mantine/tiptap/styles.css';
import { IconUpload, IconChevronDown } from '@tabler/icons-react';
// import { toast } from 'react-toastify';
// import { MAX_FILE_SIZE } from '../../constants/common';
// import type { TAttachment } from '../../store/types/common.types';
import { cn } from '../../utils/helper';
// import { pushAttachments } from '../../store/services/commentAttachments/comments';
// import { useDispatch } from 'react-redux';
// import { Button } from '../base/button';
// import UploadImageIcon from '../icons/UploadImageIcon';
// import { useFormikContext } from 'formik';
// const { getFieldHelpers } = useFormikContext();

type TMantineTextEditorProps = {
  // setAttachments: Dispatch<SetStateAction<TAttachment[]>>;
  editor: Editor;
  isUploadingImages?: boolean;
  onUploadImages?: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  contentClassName?: string;
  inputId?: string;
  multiple?: boolean;
  rootClassName?: string;
  editorClassName?: string;
  disabled?: boolean;
};

export default function MantineTextEditor({
  editor,
  isUploadingImages,
  onUploadImages,
  contentClassName,
  inputId,
  multiple = false,
  editorClassName,
  rootClassName,
  disabled = false,
}: TMantineTextEditorProps) {
  const [showTableMenu, setShowTableMenu] = useState(false);
  return (
    <RichTextEditor
      classNames={{ content: cn(contentClassName), root: rootClassName }}
      editor={editor}
    >
      <RichTextEditor.Toolbar
        sticky
        stickyOffset='var(--docs-header-height)'
        className={cn(disabled && 'pointer-events-none opacity-60')}
      >
        <RichTextEditor.ControlsGroup>
          <select
            value={
              editor.isActive('heading', { level: 1 })
                ? 'h1'
                : editor.isActive('heading', { level: 2 })
                  ? 'h2'
                  : editor.isActive('heading', { level: 3 })
                    ? 'h3'
                    : editor.isActive('heading', { level: 4 })
                      ? 'h4'
                      : 'paragraph'
            }
            onChange={(e) => {
              if (disabled) return;
              const value = e.target.value;
              if (value === 'paragraph') {
                editor.chain().focus().setParagraph().run();
              } else if (value === 'h1') {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
              } else if (value === 'h2') {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
              } else if (value === 'h3') {
                editor.chain().focus().toggleHeading({ level: 3 }).run();
              } else if (value === 'h4') {
                editor.chain().focus().toggleHeading({ level: 4 }).run();
              }
            }}
            className='px-2 py-1 text-sm border border-gray-300 rounded hover:bg-neutral-100 cursor-pointer bg-white'
            title='Text Style'
            disabled={disabled}
          >
            <option value='paragraph'>Paragraph</option>
            <option value='h1'>Heading 1</option>
            <option value='h2'>Heading 2</option>
            <option value='h3'>Heading 3</option>
            <option value='h4'>Heading 4</option>
          </select>
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Bold />
          <RichTextEditor.Italic />
          <RichTextEditor.Strikethrough />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Link />
          <RichTextEditor.Unlink />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <button
            type='button'
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`hover:bg-neutral-100 rounded-sm text-text-subHeading px-1.5 cursor-pointer py-1 ${
              editor.isActive('taskList') ? 'bg-neutral-100' : ''
            }`}
            title='Task List'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='size-4'
            >
              <rect x='3' y='5' width='6' height='6' rx='1' />
              <path d='m3 17 2 2 4-4' />
              <path d='M13 6h8' />
              <path d='M13 12h8' />
              <path d='M13 18h8' />
            </svg>
          </button>
          <RichTextEditor.BulletList />
          <RichTextEditor.OrderedList />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.AlignLeft />
          <RichTextEditor.AlignCenter />
          <RichTextEditor.AlignJustify />
          <RichTextEditor.AlignRight />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          {inputId && (
            <>
              <button
                type='button'
                disabled={disabled || isUploadingImages}
                className='hover:bg-neutral-100 rounded-sm text-text-subHeading px-1.5 cursor-pointer py-1'
                title='Insert Image'
              >
                <IconUpload
                  onClick={() => {
                    if (!disabled) {
                      document.getElementById(inputId)?.click();
                    }
                  }}
                  className='size-4'
                />
              </button>
              <input
                type='file'
                id={inputId}
                accept='image/*'
                onChange={onUploadImages}
                style={{ display: 'none' }}
                multiple={multiple}
                disabled={disabled}
              />
            </>
          )}
          <RichTextEditor.Blockquote />
          <div className='relative'>
            <div className='flex items-center'>
              <button
                type='button'
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run()
                }
                className='hover:bg-neutral-100 rounded-l-sm text-text-subHeading px-1.5 cursor-pointer py-1'
                title='Insert Table'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='size-4'
                >
                  <path d='M12 3v18' />
                  <path d='M3 12h18' />
                  <rect x='3' y='3' width='18' height='18' rx='2' />
                </svg>
              </button>
              {editor.isActive('table') && (
                <button
                  type='button'
                  onClick={() => setShowTableMenu(!showTableMenu)}
                  className='hover:bg-neutral-100 rounded-r-sm text-text-subHeading px-0.5 cursor-pointer py-1 border-l border-gray-300'
                  title='Table Options'
                >
                  <IconChevronDown className='size-3' />
                </button>
              )}
            </div>
            {showTableMenu && editor.isActive('table') && (
              <>
                <div className='fixed inset-0 z-10' onClick={() => setShowTableMenu(false)} />
                <div className='absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg p-1 z-20 flex flex-col gap-1 min-w-[160px]'>
                  <button
                    type='button'
                    onClick={() => {
                      editor.chain().focus().addColumnBefore().run();
                      setShowTableMenu(false);
                    }}
                    disabled={!editor.can().addColumnBefore()}
                    className='px-2 py-1 text-xs hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed text-left'
                    title='Add Column Before'
                  >
                    Add Column Before
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      editor.chain().focus().addColumnAfter().run();
                      setShowTableMenu(false);
                    }}
                    disabled={!editor.can().addColumnAfter()}
                    className='px-2 py-1 text-xs hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed text-left'
                    title='Add Column After'
                  >
                    Add Column After
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      editor.chain().focus().deleteColumn().run();
                      setShowTableMenu(false);
                    }}
                    disabled={!editor.can().deleteColumn()}
                    className='px-2 py-1 text-xs hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed text-left'
                    title='Delete Column'
                  >
                    Delete Column
                  </button>
                  <div className='border-t border-gray-200 my-1' />
                  <button
                    type='button'
                    onClick={() => {
                      editor.chain().focus().addRowBefore().run();
                      setShowTableMenu(false);
                    }}
                    disabled={!editor.can().addRowBefore()}
                    className='px-2 py-1 text-xs hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed text-left'
                    title='Add Row Before'
                  >
                    Add Row Before
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      editor.chain().focus().addRowAfter().run();
                      setShowTableMenu(false);
                    }}
                    disabled={!editor.can().addRowAfter()}
                    className='px-2 py-1 text-xs hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed text-left'
                    title='Add Row After'
                  >
                    Add Row After
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      editor.chain().focus().deleteRow().run();
                      setShowTableMenu(false);
                    }}
                    disabled={!editor.can().deleteRow()}
                    className='px-2 py-1 text-xs hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed text-left'
                    title='Delete Row'
                  >
                    Delete Row
                  </button>
                  <div className='border-t border-gray-200 my-1' />
                  <button
                    type='button'
                    onClick={() => {
                      editor.chain().focus().deleteTable().run();
                      setShowTableMenu(false);
                    }}
                    disabled={!editor.can().deleteTable()}
                    className='px-2 py-1 text-xs hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed text-left text-red-600'
                    title='Delete Table'
                  >
                    Delete Table
                  </button>
                </div>
              </>
            )}
          </div>
          <RichTextEditor.Code />
          <button
            type='button'
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`hover:bg-neutral-100 rounded-sm text-text-subHeading px-1.5 cursor-pointer py-1 ${
              editor.isActive('codeBlock') ? 'bg-neutral-100' : ''
            }`}
            title='Code Block'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='size-4'
            >
              <rect x='2' y='4' width='20' height='16' rx='2' />
              <path d='M6 8h4' />
              <path d='M6 12h4' />
              <path d='M14 8h4' />
              <path d='M14 12h4' />
            </svg>
          </button>
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.ClearFormatting />
          <RichTextEditor.Hr />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Undo />
          <RichTextEditor.Redo />
        </RichTextEditor.ControlsGroup>
        {/* <Button variant='outline' className='size-3 text-sm'> */}
      </RichTextEditor.Toolbar>

      <RichTextEditor.Content
        className={editorClassName}
        classNames={{ root: '!border-0 flex-1 overflow-y-auto' }}
        // onKeyUp={handleKeyUp}
        // onBlur={() => setHeight('4rem')}
        // onClick={handleContentClick}
      />
    </RichTextEditor>
  );
}
