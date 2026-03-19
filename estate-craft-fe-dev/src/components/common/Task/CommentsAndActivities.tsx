import { useState, type Dispatch, type SetStateAction, useEffect, Suspense } from 'react';
import { Button } from '../../base';
import { MAX_FILE_SIZE } from '../../../constants/common';
import MantineTextEditor from '../MantineTextEditor';
import Avatar from '../Avatar';
import { getUser } from '../../../utils/auth';
import { useEditor } from '@tiptap/react';

import Highlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';

import { cn, parseHTMLToText } from '../../../utils/helper';
import {
  useDeleteCommentMutation,
  useGetCommentsQuery,
  type TComment,
  useUpdateCommentMutation,
} from '../../../store/services/commentAndActivities/commentSlice';
import {
  useGetActivitiesQuery,
  type TActivity,
} from '../../../store/services/commentAndActivities/activitiesSlice';
import { useLazyGetProjectAssignedUsersQuery } from '../../../store/services/project/projectSlice';
import { toast } from 'react-toastify';
import {
  useDeleteFileMutation,
  useUploadFilesMutation,
} from '../../../store/services/upload/upload';
import { format } from 'date-fns';
import IconButton from '../../base/button/IconButton';
import { DeleteIcon, EditIcon } from '../..';
import AlertModal from '../../base/AlertModal';
import { useDisclosure } from '@mantine/hooks';
import useUrlSearchParams from '../../../hooks/useUrlSearchParams';
import { CustomImageExtension } from './CommentImageExtention';
import { CommentMentionsExtension } from './CustomMentionExtention';

export default function CommentsAndActivities({
  projectId,
  taskId,
}: {
  projectId?: string;
  taskId?: string;
}) {
  const [component, setComponent] = useState('comments');
  function renderSubComponent() {
    switch (component) {
      case 'comments':
        return <CommentsTab projectId={projectId} />;
      case 'activities':
        return <ActivitiesTab taskId={taskId} />;
    }
  }
  return (
    <section className='w-full bg-bg-light'>
      <div className='flex px-3 pt-3 gap-5 mb-3'>
        <button
          type='button'
          className={cn(
            'cursor-pointer pb-2   border-b-2 ',
            component === 'comments' ? '' : 'border-b-transparent',
          )}
          onClick={() => setComponent('comments')}
        >
          Comments
        </button>
        <button
          type='button'
          className={cn(
            'cursor-pointer pb-2  border-b-2 ',
            component === 'activities' ? '' : 'border-b-transparent',
          )}
          onClick={() => setComponent('activities')}
        >
          Activities
        </button>
      </div>
      {renderSubComponent()}
    </section>
  );
}

//////////////////////CommentsTab

function CommentsTab({ projectId }: { projectId?: string }) {
  const { getParam } = useUrlSearchParams();
  const taskId = getParam('taskId');
  const [deleteComment, { isLoading: isDeletingComment }] = useDeleteCommentMutation();
  const { data } = useGetCommentsQuery({ taskId: taskId || '' }, { skip: !taskId });
  const [isOpenDeleteModal, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [activeComment, setActiveComment] = useState<TComment | null>(null);
  function handleDeleteComment() {
    if (!activeComment?.id) {
      console.log('comment id is undefined/null');
      return;
    }
    deleteComment({ id: activeComment?.id })
      .unwrap()
      .then(() => {
        closeDeleteModal();
      })
      .catch((error) => {
        console.log({ error });
        toast.error('Unable to delete comment');
      });
  }
  return (
    <>
      <div className='flex flex-col gap-5 px-4 pb-4 '>
        <Suspense>
          {!data?.comments || data?.comments?.length === 0 ? (
            <p className='text-sm text-text-subHeading font-medium'>No Comments found</p>
          ) : (
            data?.comments?.map((comment) => (
              <Comment
                openDeleteModal={openDeleteModal}
                setActiveComment={setActiveComment}
                comment={comment}
                projectId={projectId}
              />
            ))
          )}
        </Suspense>
      </div>

      <AlertModal
        opened={isOpenDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteComment}
        isLoading={isDeletingComment}
        title={`Delete - ${parseHTMLToText(activeComment?.content)}?`}
      />
    </>
  );
}
//////ActivitiesTab
function ActivitiesTab({ taskId }: { taskId?: string }) {
  const { getParam } = useUrlSearchParams();
  const taskIdParam = getParam('taskId');
  const taskIdToUse = taskId || taskIdParam;
  const { data: activitiesData } = useGetActivitiesQuery(
    {
      taskId: taskIdToUse || '',
    },
    { skip: !taskIdToUse },
  );
  return (
    <div className='px-4 pb-4 flex flex-col gap-3'>
      <Suspense>
        {!activitiesData?.activities || activitiesData?.activities?.length === 0 ? (
          <p className='font-medium text-sm text-text-subHeading '>No Activities yet😙</p>
        ) : (
          activitiesData?.activities?.map((activityData) => (
            <>
              <Activity key={activityData?.id} activityData={activityData} />
              <hr className='w-full' />
            </>
          ))
        )}
      </Suspense>
    </div>
  );
}
///////////////////AVTIVITY

function getActivityBadgeStyle(activityType: string) {
  switch (activityType?.toLowerCase()) {
    case 'timesheet':
      return 'bg-amber-100 text-amber-700';
    case 'create':
      return 'bg-green-100 text-green-700';
    case 'delete':
      return 'bg-red-100 text-red-700';
    case 'status_change':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-bg-secondary';
  }
}

function Activity({ activityData }: { activityData: TActivity }) {
  const isTimesheet = activityData?.activityType?.toLowerCase() === 'timesheet';
  const badgeStyle = getActivityBadgeStyle(activityData?.activityType);

  return (
    <div className='flex gap-2 items-start'>
      <Avatar size='sm' name={activityData?.user?.name} />
      <div className='flex-1 min-w-0'>
        <p className='text-sm'>
          {activityData?.user?.name}
          <span className='ml-4 text-text-subHeading text-xs'>
            {activityData?.createdAt && format(activityData?.createdAt, 'dd MMM yyyy hh:mm a')}
          </span>
        </p>
        <div className='flex gap-2 mt-1 items-center flex-wrap'>
          <div
            className={cn(
              'rounded-sm px-1.5 py-0.5 w-fit text-xs font-medium capitalize',
              badgeStyle,
            )}
          >
            {isTimesheet ? 'timesheet' : activityData?.activityType}
          </div>
          <p className='text-sm text-text-secondary'>{activityData?.activity}</p>
        </div>
        {isTimesheet && activityData?.metadata?.durationMinutes != null && (
          <p className='text-xs text-text-subHeading mt-1'>
            Duration: {formatDurationLabel(activityData.metadata.durationMinutes)}
          </p>
        )}
      </div>
    </div>
  );
}

function formatDurationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

//////////////////////Comment
type TCommentProps = {
  comment: TComment;
  openDeleteModal: () => void;
  setActiveComment: Dispatch<SetStateAction<TComment | null>>;
  projectId?: string;
};
function Comment({ comment, openDeleteModal, setActiveComment, projectId }: TCommentProps) {
  const [openEditComment, setOpenEditComment] = useState(false);
  if (openEditComment)
    return (
      <EditCommentInput
        commentData={comment}
        closeCommentInput={() => setOpenEditComment(false)}
        projectId={projectId}
      />
    );
  return (
    <>
      <div className='flex gap-2 justify-between group'>
        <section className='flex gap-2 group'>
          <Avatar size='sm' name={comment?.createdByUser?.name} />

          <div className='flex flex-col'>
            <p className='text-sm font-medium'>{comment?.createdByUser?.name} </p>
            <div dangerouslySetInnerHTML={{ __html: comment?.content }} className='text-sm' />
          </div>
        </section>
        {getUser()?.id === comment?.createdByUser?.id && (
          <section className='invisible group-hover:visible text-text-subHeading flex'>
            <IconButton
              onClick={() => {
                openDeleteModal();
                setActiveComment(comment);
              }}
              type='button'
              className='shrink-0'
            >
              <DeleteIcon />
            </IconButton>
            <IconButton onClick={() => setOpenEditComment(true)} type='button'>
              <EditIcon />
            </IconButton>
          </section>
        )}
      </div>
    </>
  );
}

/////////////////////////////EditCommentInput
function EditCommentInput({
  commentData,
  closeCommentInput,
  projectId,
}: {
  commentData: TComment;
  closeCommentInput: () => void;
  projectId?: string;
}) {
  const [deleteFile, { isLoading: isDeletingFile }] = useDeleteFileMutation();
  console.log({ isDeletingFile });
  const [uploadFiles, { isLoading: isUploadingImages }] = useUploadFilesMutation();
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
    content: commentData?.content,
  });

  function handleComment() {
    if (editor.isEmpty) return;
    const html = editor.getHTML();
    editComment({ id: commentData?.id || '', content: html })
      .unwrap()
      .then(() => {
        editor.commands.clearContent();
        closeCommentInput();
      })
      .catch((error) => {
        console.log({ error });
      });
    // }
  }

  async function onUploadImages(e: React.ChangeEvent<HTMLInputElement>) {
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
    if (!commentData?.attachments) return;
    for (const image of commentData.attachments) {
      editor?.commands.setImage({
        src: image?.url,
        //@ts-expect-error for deleting image
        key: image?.key || '',
      });
    }
  }, [commentData, editor]);
  return (
    <>
      <div className='flex flex-col'>
        <div className='flex  gap-2'>
          <Avatar name={commentData?.createdByUser?.name || ''} size='sm' />
          <div className='flex flex-col border bg-white'>
            <MantineTextEditor
              editorClassName='!border-0 !outline-none'
              isUploadingImages={isUploadingImages}
              editor={editor}
              onUploadImages={onUploadImages}
              inputId='commentAttachment'
            />
            <div className='flex gap-2 ml-auto mb-2 mr-2'>
              <Button
                type='button'
                onClick={closeCommentInput}
                className='border-border-light rounded-md mt-2 text-sm'
                disabled={isEditingComment}
              >
                Cancel
              </Button>
              <Button
                type='button'
                onClick={handleComment}
                variant='outline'
                className=' border-border-light bg-white  rounded-md mt-2 text-sm'
                disabled={isEditingComment}
              >
                {isEditingComment ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
