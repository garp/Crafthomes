import Highlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlock from '@tiptap/extension-code-block';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { CommentMentionsExtension } from './Task/CustomMentionExtention';
import { useLazyGetUsersQuery } from '../../store/services/user/userSlice';
import { useUploadFilesMutation } from '../../store/services/upload/upload';
import { useEditor } from '@tiptap/react';
import { useState, useEffect, useId, useCallback } from 'react';
import MantineTextEditor from './MantineTextEditor';
import { toast } from 'react-toastify';
import { MAX_FILE_SIZE } from '../../constants/common';
import Spinner from './loaders/Spinner';

const MAX_LENGTH = 10000;

type TRichTextEditorDescriptionProps = {
  value: string | undefined;
  setValue: (val: string) => void;
  placeholder?: string;
  imageFolder?: string;
};

export default function RichTextEditorDescription({
  value,
  setValue,
  placeholder = 'Add Description',
  imageFolder = 'estatecraft-description-images',
}: TRichTextEditorDescriptionProps) {
  const [triggerSearchUsers] = useLazyGetUsersQuery();
  const [characterCount, setCharacterCount] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const inputId = useId();

  const [uploadFiles] = useUploadFilesMutation();

  // Upload image and return URL
  const uploadImage = useCallback(
    async (file: File): Promise<string | null> => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File size must be less than 10 MB');
        return null;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return null;
      }

      const formData = new FormData();
      formData.append('files', file);
      formData.append('folder', imageFolder);

      try {
        setIsUploadingImage(true);
        const res = await uploadFiles(formData).unwrap();
        const uploadedFile = res?.data?.files?.[0];
        return uploadedFile?.url || null;
      } catch (error) {
        toast.error('Failed to upload image');
        console.error('Upload error:', error);
        return null;
      } finally {
        setIsUploadingImage(false);
      }
    },
    [uploadFiles, imageFolder],
  );

  const editor = useEditor({
    shouldRerenderOnTransaction: true,
    extensions: [
      CommentMentionsExtension(triggerSearchUsers),
      StarterKit.configure({
        link: false,
        codeBlock: false, // Use custom code block extension
      }),
      Link,
      Superscript,
      SubScript,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder: placeholder,
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-md my-2',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 p-4 rounded-md my-2 font-mono text-sm',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300 my-4 w-full',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border border-gray-300',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 bg-gray-100 px-4 py-2 font-semibold text-left',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-4 py-2',
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'list-none pl-0 my-2',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex items-start gap-2 my-1',
        },
      }),
    ],
    content: value || '',
    editorProps: {
      handleDOMEvents: {
        beforeinput: (view, event) => {
          const currentText = view.state.doc.textContent;
          // Prevent typing if at or over the limit
          if (currentText.length >= MAX_LENGTH && event.inputType === 'insertText') {
            event.preventDefault();
            return true;
          }
          return false;
        },
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              uploadImage(file).then((url) => {
                if (url && editor) {
                  editor.chain().focus().setImage({ src: url }).run();
                }
              });
            }
            return true;
          }
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        const file = files[0];
        if (file.type.startsWith('image/')) {
          event.preventDefault();
          uploadImage(file).then((url) => {
            if (url && editor) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          });
          return true;
        }
        return false;
      },
    },
    onUpdate({ editor }) {
      const text = editor.getText();
      const count = text.length;

      // Enforce max length - truncate if somehow exceeded (e.g., from paste)
      if (count > MAX_LENGTH) {
        // Truncate to max length (fallback for paste operations)
        const truncatedText = text.substring(0, MAX_LENGTH);
        // Set as plain text to avoid formatting issues
        editor.commands.setContent(`<p>${truncatedText}</p>`);
        setCharacterCount(MAX_LENGTH);
        setValue(editor.getHTML());
      } else {
        setCharacterCount(count);
        setValue(editor.getHTML());
      }
    },
  });

  // Update character count when value changes externally
  useEffect(() => {
    if (editor && value !== undefined) {
      const text = editor.getText();
      setCharacterCount(text.length);
    }
  }, [editor, value]);

  // Update editor content when value changes externally (e.g., when editing existing item)
  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  // Handle file input upload (from toolbar button)
  async function handleUploadImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !editor) return;

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const url = await uploadImage(file);
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      }
    }

    // Reset input
    e.target.value = '';
  }

  return (
    <div className='flex-1 flex flex-col' style={{ maxHeight: '100vh' }}>
      <div className='flex-1 flex flex-col min-h-0 overflow-scroll relative'>
        <MantineTextEditor
          editorClassName='min-h-40 !border-0 !outline-none shadow-sm'
          rootClassName='flex-1 flex flex-col h-full min-h-0'
          contentClassName='flex-1 min-h-0'
          editor={editor}
          inputId={inputId}
          isUploadingImages={isUploadingImage}
          onUploadImages={handleUploadImages}
        />
        {isUploadingImage && (
          <div className='absolute inset-0 bg-white/70 flex items-center justify-center z-10'>
            <div className='flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md'>
              <Spinner className='size-5' />
              <span className='text-sm text-gray-600'>Uploading image...</span>
            </div>
          </div>
        )}
      </div>

      <div className='flex justify-end mt-2 shrink-0'>
        <span
          className={`text-sm ${
            characterCount > MAX_LENGTH
              ? 'text-red-500'
              : characterCount > MAX_LENGTH * 0.9
                ? 'text-orange-500'
                : 'text-gray-500'
          }`}
        >
          {characterCount.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
