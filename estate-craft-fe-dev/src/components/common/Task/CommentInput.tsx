import { useEditor } from '@tiptap/react';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import {
  useCreateCommentMutation,
  type TComment,
  useUpdateCommentMutation,
} from '../../../store/services/commentAndActivities/commentSlice';
import {
  useDeleteFileMutation,
  useUploadFilesMutation,
} from '../../../store/services/upload/upload';
// import AttachmentField from '../AttachmentField';
import { useLazyGetProjectAssignedUsersQuery } from '../../../store/services/project/projectSlice';
import type { TFormMode } from '../../../types/common.types';
import { CommentMentionsExtension } from './CustomMentionExtention';
import { CustomImageExtension } from './CommentImageExtention';

import Highlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { MAX_FILE_SIZE } from '../../../constants/common';
import { toast } from 'react-toastify';
import { useEffect } from 'react';
import MantineTextEditor from '../MantineTextEditor';

import { Avatar } from '..';
import { getUser } from '../../../utils/auth';
import { Button } from '../..';

export default function CommentInput({
  comment,
  mode,
  projectId,
  disabled = false,
}: {
  comment?: TComment;
  mode: TFormMode;
  projectId?: string;
  disabled?: boolean;
}) {
  const { getParam } = useUrlSearchParams();
  const taskId = getParam('taskId');
  const [deleteFile] = useDeleteFileMutation();
  // console.log({ isDeletingFile });
  const [uploadFiles, { isLoading: isUploadingImages }] = useUploadFilesMutation();
  const [createComment, { isLoading: isCreatingComment }] = useCreateCommentMutation();
  const [editComment, { isLoading: isEditingComment }] = useUpdateCommentMutation();
  const [triggerSearchProjectUsers] = useLazyGetProjectAssignedUsersQuery();
  const editor = useEditor({
    shouldRerenderOnTransaction: true,
    extensions: [
      CustomImageExtension(deleteFile),
      CommentMentionsExtension(triggerSearchProjectUsers, projectId),
      StarterKit.configure({ link: false }),
      Link,
      Superscript,
      SubScript,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder: 'Add a comment',
      }),
    ],
    content: comment?.content,
    editable: !disabled,
  });

  function handleComment() {
    if (disabled) return;
    if (editor.isEmpty) return;
    const html = editor.getHTML();
    if (mode === 'create') {
      createComment({ taskId: taskId || '', content: html })
        .unwrap()
        .then(() => {
          editor.commands.clearContent();
        })
        .catch((error) => {
          console.log({ error });
        });
    } else {
      editComment({ id: comment?.id || '', content: html })
        .unwrap()
        .then(() => {
          editor.commands.clearContent();
        })
        .catch((error) => {
          console.log({ error });
        });
    }
  }

  async function onUploadImages(e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) return;
    const files = e.target.files;
    if (!files) return;

    if (files?.length > 5 || files.length > 5) {
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
        console.log({ uploadedFiles });

        for (const image of uploadedFiles) {
          if (image?.url)
            editor
              ?.chain()
              .focus()
              .setImage({
                src: image.url,
                // Store the key in the node
              })
              .updateAttributes('image', image)
              .run();
        }
      })
      .catch((e) => {
        console.log(e);
        toast.error('Unable to upload file');
      });
  }
  useEffect(() => {
    if (!comment?.attachments || mode !== 'edit') return;
    for (const image of comment.attachments) {
      editor?.commands.setImage({
        src: image?.url,
        //@ts-expect-error for deleting image
        key: image?.key || '',
      });
    }
  }, [comment, editor, mode]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  if (disabled) return null;

  return (
    <>
      <div className='flex gap-2'>
        <Avatar name={getUser()?.name || ''} size='sm' />
        <div className='flex border rounded-md bg-white flex-col gap-2'>
          {/* <CommentTextEditor /> */}
          <MantineTextEditor
            isUploadingImages={isUploadingImages}
            // setAttachments={setAttachments}
            editor={editor}
            onUploadImages={onUploadImages}
            inputId='commentAttachment'
            rootClassName='!border-0'
            // multiple
            disabled={disabled}
          />
          <Button
            type='button'
            onClick={handleComment}
            variant='outline'
            className=' border-border-light bg-white ml-auto rounded-md mt-2 text-sm mb-2 mr-2'
            disabled={isCreatingComment || !taskId}
          >
            {isCreatingComment || isEditingComment ? 'Commenting...' : 'Comment'}
          </Button>
        </div>
      </div>
    </>
  );
}
