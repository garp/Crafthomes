import MantineTextEditor from '../../../../components/common/MantineTextEditor';
import { useEditor } from '@tiptap/react';
import Highlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';
import { CommentMentionsExtension } from '../../../../components/common/Task/CustomMentionExtention';
import { useLazyGetSearchedUsersQuery } from '../../../../store/services/user/userSlice';

type TMeetingPurposeEditorProps = {
  value: string;
  setValue: (arg: string) => void;
  placeholder?: string;
};

export default function MeetingPurposeEditor({
  value,
  setValue,
  placeholder = 'Add Meeting Purpose',
}: TMeetingPurposeEditorProps) {
  const [triggerSearchUsers] = useLazyGetSearchedUsersQuery();

  const editor = useEditor({
    shouldRerenderOnTransaction: false,
    extensions: [
      CommentMentionsExtension(triggerSearchUsers),
      StarterKit.configure({ link: false }),
      Link,
      Superscript,
      SubScript,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    onUpdate({ editor }) {
      setValue(editor.getHTML());
    },
  });

  // Update editor content when value changes externally (e.g., when editing existing MOM)
  useEffect(() => {
    if (editor && value && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div>
      <MantineTextEditor editor={editor} contentClassName='min-h-40' rootClassName='w-full' />
    </div>
  );
}
