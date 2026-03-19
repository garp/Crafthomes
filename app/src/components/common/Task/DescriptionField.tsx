import MantineTextEditor from '../MantineTextEditor';

import { useEditor } from '@tiptap/react';
import { useState, useEffect } from 'react';

import Highlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import {
  useDeleteFileMutation,
  useUploadFilesMutation,
} from '../../../store/services/upload/upload';
import { useAppSelector } from '../../../store/hooks';
import { useDispatch } from 'react-redux';
import { CustomImageExtension } from './CommentImageExtention';
import { toast } from 'react-toastify';
import { MAX_FILE_SIZE } from '../../../constants/common';
import { pushAttachments } from '../../../store/services/commentAttachments/comments';
import FormLabel from '../../base/FormLabel';

const MAX_LENGTH = 10000;

type TDescriptionFieldProps = {
  value: string;
  setValue: (arg: string) => void;
  label?: string;
  disabled?: boolean;
};

export default function DescriptionField({
  value,
  setValue,
  label = 'Add Description',
  disabled = false,
}: TDescriptionFieldProps) {
  const [deleteFile] = useDeleteFileMutation();
  const [uploadFiles, { isLoading: isUploadingImages }] = useUploadFilesMutation();
  const tasksAttachments = useAppSelector((state) => state.commentAttachments?.attachments);
  const [characterCount, setCharacterCount] = useState(0);
  // const [attachments, setAttachments] = useState<TAttachment[]>([]);
  const dispatch = useDispatch();
  // const CustomImage = TipTapImage.extend({
  //   addAttributes() {
  //     return {
  //       ...(this as any).parent?.(),
  //       key: {
  //         default: null,
  //         parseHTML: (element: any) => element.getAttribute('data-key'),
  //         renderHTML: (attributes: { key: string }) => {
  //           if (!attributes.key) {
  //             return {};
  //           }
  //           return {
  //             'data-key': attributes.key,
  //           };
  //         },
  //       },
  //     };
  //   },
  //   addNodeView() {
  //     return ({ node, getPos, editor }: any) => {
  //       const dom = document.createElement('span');
  //       dom.style.position = 'relative';
  //       dom.style.display = 'inline-block';
  //       dom.style.margin = '4px';

  //       const img = document.createElement('img');
  //       img.src = node.attrs.src;
  //       img.alt = node.attrs.alt || '';
  //       img.style.maxWidth = '100%';
  //       img.style.borderRadius = '6px';

  //       const deleteBtn = document.createElement('button');
  //       deleteBtn.type = 'button';
  //       deleteBtn.textContent = '×';
  //       deleteBtn.style.position = 'absolute';
  //       deleteBtn.style.top = '4px';
  //       deleteBtn.style.right = '4px';
  //       deleteBtn.style.width = '24px';
  //       deleteBtn.style.height = '24px';
  //       deleteBtn.style.borderRadius = '50%';
  //       deleteBtn.style.background = 'rgba(0,0,0,0.7)';
  //       deleteBtn.style.color = 'white';
  //       deleteBtn.style.border = 'none';
  //       deleteBtn.style.cursor = 'pointer';
  //       deleteBtn.style.fontSize = '16px';
  //       deleteBtn.style.lineHeight = '20px';
  //       deleteBtn.style.zIndex = '1';
  //       deleteBtn.title = 'Remove image';

  //       deleteBtn.onclick = () => {
  //         if (typeof getPos === 'function') {
  //           const imageKey = node.attrs.key;
  //           console.log({ imageKey });
  //           const pos = getPos();
  //           deleteFile({ key: imageKey })
  //             .unwrap()
  //             .then(() => {
  //               editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
  //               dispatch(removeAttachment({ key: imageKey }));
  //             })
  //             .catch((error) => {
  //               toast.error('Unable to delete file');
  //               console.log(error);
  //             });
  //         }
  //       };

  //       dom.appendChild(img);
  //       dom.appendChild(deleteBtn);

  //       return {
  //         dom,
  //         update: (updatedNode: any) => {
  //           if (updatedNode.type.name !== 'image') return false;
  //           img.src = updatedNode.attrs.src;
  //           img.alt = updatedNode.attrs.alt || '';
  //           return true;
  //         },
  //       };
  //     };
  //   },
  // });
  const editor = useEditor({
    shouldRerenderOnTransaction: true,
    extensions: [
      CustomImageExtension(deleteFile),
      StarterKit.configure({ link: false }),
      Link,
      Superscript,
      SubScript,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder: 'Add Description',
      }),
    ],
    content: value,
    editable: !disabled,
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
        if (disabled) return true;
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file && editor) {
              const currentCount = tasksAttachments?.length ?? 0;
              if (currentCount >= 5) {
                toast.error('Maximum 5 images allowed');
                return true;
              }
              if (file.size > MAX_FILE_SIZE) {
                toast.error('File size must be less than 10 MB');
                return true;
              }
              const blobUrl = URL.createObjectURL(file);
              editor.chain().focus().setImage({ src: blobUrl }).run();
              const formData = new FormData();
              formData.append('files', file);
              formData.append('folder', 'estatecraft-comments-attachments');
              uploadFiles(formData)
                .unwrap()
                .then((res) => {
                  const uploadedFiles = res?.data?.files ?? [];
                  const first = uploadedFiles[0];
                  if (first?.url && editor) {
                    dispatch(pushAttachments([first]));
                    const { state } = editor;
                    const { doc } = state;
                    let posToUpdate: number | null = null;
                    doc.descendants((node, pos) => {
                      if (node.type.name === 'image' && node.attrs.src === blobUrl) {
                        posToUpdate = pos;
                        return false;
                      }
                    });
                    if (posToUpdate !== null) {
                      const node = doc.nodeAt(posToUpdate);
                      if (node)
                        editor.view.dispatch(
                          state.tr.setNodeMarkup(posToUpdate, null, {
                            ...node.attrs,
                            src: first.url,
                            key: first.key,
                          }),
                        );
                    }
                    URL.revokeObjectURL(blobUrl);
                  }
                })
                .catch(() => {
                  toast.error('Failed to upload image');
                  if (editor) {
                    const { state } = editor;
                    const { doc } = state;
                    let posToRemove: number | null = null;
                    doc.descendants((node, pos) => {
                      if (node.type.name === 'image' && node.attrs.src === blobUrl) {
                        posToRemove = pos;
                        return false;
                      }
                    });
                    if (posToRemove !== null) {
                      const node = doc.nodeAt(posToRemove);
                      if (node)
                        editor.view.dispatch(
                          state.tr.delete(posToRemove, posToRemove + node.nodeSize),
                        );
                    }
                  }
                  URL.revokeObjectURL(blobUrl);
                });
            }
            return true;
          }
        }
        return false;
      },
      handleDrop: (_view, event) => {
        if (disabled) return true;
        const files = event.dataTransfer?.files;
        if (!files?.length || !editor) return false;
        const file = files[0];
        if (!file.type.startsWith('image/')) return false;
        event.preventDefault();
        const currentCount = tasksAttachments?.length ?? 0;
        if (currentCount >= 5) {
          toast.error('Maximum 5 images allowed');
          return true;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error('File size must be less than 10 MB');
          return true;
        }
        const blobUrl = URL.createObjectURL(file);
        editor.chain().focus().setImage({ src: blobUrl }).run();
        const formData = new FormData();
        formData.append('files', file);
        formData.append('folder', 'estatecraft-comments-attachments');
        uploadFiles(formData)
          .unwrap()
          .then((res) => {
            const uploadedFiles = res?.data?.files ?? [];
            const first = uploadedFiles[0];
            if (first?.url && editor) {
              dispatch(pushAttachments([first]));
              const { state } = editor;
              const { doc } = state;
              let posToUpdate: number | null = null;
              doc.descendants((node, pos) => {
                if (node.type.name === 'image' && node.attrs.src === blobUrl) {
                  posToUpdate = pos;
                  return false;
                }
              });
              if (posToUpdate !== null) {
                const node = doc.nodeAt(posToUpdate);
                if (node)
                  editor.view.dispatch(
                    state.tr.setNodeMarkup(posToUpdate, null, {
                      ...node.attrs,
                      src: first.url,
                      key: first.key,
                    }),
                  );
              }
              URL.revokeObjectURL(blobUrl);
            }
          })
          .catch(() => {
            toast.error('Failed to upload image');
            if (editor) {
              const { state } = editor;
              const { doc } = state;
              let posToRemove: number | null = null;
              doc.descendants((node, pos) => {
                if (node.type.name === 'image' && node.attrs.src === blobUrl) {
                  posToRemove = pos;
                  return false;
                }
              });
              if (posToRemove !== null) {
                const node = doc.nodeAt(posToRemove);
                if (node)
                  editor.view.dispatch(state.tr.delete(posToRemove, posToRemove + node.nodeSize));
              }
            }
            URL.revokeObjectURL(blobUrl);
          });
        return true;
      },
    },
    onUpdate({ editor }) {
      const text = editor.getText();
      const count = text.length;

      // Enforce max length - truncate if somehow exceeded (e.g., from paste)
      if (count > MAX_LENGTH) {
        const truncatedText = text.substring(0, MAX_LENGTH);
        editor.commands.setContent(`<p>${truncatedText}</p>`);
        setCharacterCount(MAX_LENGTH);
        setValue(`<p>${truncatedText}</p>`);
      } else {
        setCharacterCount(count);
        setValue(editor.isEmpty ? '' : editor.getHTML());
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

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  async function onUploadImages(e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) return;
    const files = e.target.files;
    if (!files) return;

    if (files?.length > 5 || (tasksAttachments?.length || 0) + files.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    const formData = new FormData();
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File size must be less than 10 MB');
        return;
      }
      formData.append('files', file);
    }
    formData.append('folder', 'estatecraft-comments-attachments');
    uploadFiles(formData)
      .unwrap()
      .then((res) => {
        const uploadedFiles = res?.data?.files;
        // setAttachments([...(attachments || []), ...uploadedFiles]);
        // setFieldValue('attachment', uploadFiles);
        dispatch(pushAttachments(uploadedFiles));
        console.log({ uploadedFiles });
        for (const image of uploadedFiles) {
          if (image?.url)
            editor
              .chain()
              .focus()
              //@ts-expect-error for deleting the file, inserting key inside node
              .setImage({ src: image.url, key: image.key })
              .run();
        }
      });
  }

  return (
    <div>
      <FormLabel htmlFor='description'>{label}</FormLabel>
      <MantineTextEditor
        inputId='description-attachments'
        isUploadingImages={isUploadingImages}
        // setAttachments={setAttachments}
        editor={editor}
        onUploadImages={onUploadImages}
        contentClassName='min-h-40'
        disabled={disabled}
      />
      <div className='flex justify-end mt-2'>
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
