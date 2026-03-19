// src/.../MOMFormPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useFormik } from 'formik';

import Container from '../../../../components/common/Container';
import FormLabel from '../../../../components/base/FormLabel';
import FormInput from '../../../../components/base/FormInput';
import FormDate from '../../../../components/base/FormDate';
import FormSelect from '../../../../components/base/FormSelect';
import { Button } from '../../../../components';
import { RichTextEditor } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';

// import Placeholder from '@tiptap/extension-placeholder';

import '@mantine/core/styles.css';
import '@mantine/tiptap/styles.css';
import { createVersionSchema } from '../../../../validators/version';
import { IconPlus } from '@tabler/icons-react';
// import ProjectLayout from '../../../../components/layout/ProjectLayout';

type Values = {
  momTitle: string;
  date: Date | null;
  location: string;
  agenda: string;
  shareWith: string;
  meetingPoints: string;
};

export default function MOMFormPage() {
  const [files, setFiles] = useState<File[]>([]);

  const formik = useFormik<Values>({
    initialValues: {
      momTitle: '',
      date: null,
      location: '',
      agenda: '',
      shareWith: '',
      meetingPoints: '',
    },
    validationSchema: createVersionSchema,
    onSubmit: (values, helpers) => {
      // attachments are outside formik in this example
      console.log('SUBMIT', { ...values, attachments: files });
      helpers.setSubmitting(false);
    },
    validateOnBlur: true,
    validateOnChange: false,
  });

  // keep a stable ref to setFieldValue so editor's onUpdate doesn't close over stale value
  const setFieldValueRef = useRef(formik.setFieldValue);
  useEffect(() => {
    setFieldValueRef.current = formik.setFieldValue;
  }, [formik.setFieldValue]);

  // create tiptap editor once — placeholder extension for placeholder text
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: formik.values.meetingPoints || '',
    onUpdate: ({ editor }) => {
      // update formik value with HTML
      setFieldValueRef.current('meetingPoints', editor.getHTML());
    },
  });

  // keep editor content in sync if formik value changes externally
  useEffect(() => {
    if (!editor) return;
    const html = formik.values.meetingPoints || '';
    if (editor.getHTML() !== html) {
      // preserve selection if possible
      // editor.commands.setContent(html, {parseOptions:{}});
    }
  }, [editor, formik.values.meetingPoints]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const list = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...list]);
    // clear input to allow re-adding same file if needed
    e.currentTarget.value = '';
  };
  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  return (
    <Container className=''>
      <form onSubmit={formik.handleSubmit} className='flex flex-col gap-6'>
        {/* Title */}
        <div>
          <FormLabel>MOM Title</FormLabel>
          <FormInput
            name='momTitle'
            placeholder='Enter MOM Title'
            value={formik.values.momTitle}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.momTitle ? (formik.errors.momTitle as string | undefined) : undefined
            }
            className='mt-1 w-full'
          />
        </div>

        {/* Date | Location | Agenda */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
          <div>
            <FormLabel>Date</FormLabel>
            <FormDate
              name='date'
              placeholder='Select Date'
              value={formik.values.date}
              onChange={(value) => formik.setFieldValue('date', value)}
              onBlur={() => formik.setFieldTouched('date', true)}
              error={formik.touched.date ? (formik.errors.date as string | undefined) : undefined}
              className='mt-1 w-full'
            />
          </div>

          <div>
            <FormLabel>Location</FormLabel>
            <FormInput
              name='location'
              placeholder='Enter Location'
              value={formik.values.location}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.location ? (formik.errors.location as string | undefined) : undefined
              }
              className='mt-1 w-full'
            />
          </div>

          <div>
            <FormLabel>Agenda</FormLabel>
            <FormInput
              name='agenda'
              placeholder='Enter Agenda'
              value={formik.values.agenda}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.agenda ? (formik.errors.agenda as string | undefined) : undefined
              }
              className='mt-1 w-full'
            />
          </div>
        </div>

        {/* Share With (custom FormSelect expects `data` prop) */}
        <div>
          <FormLabel>Share With</FormLabel>
          <FormSelect
            name='shareWith'
            placeholder='Select a member'
            options={[
              { label: 'John Doe', value: 'john' },
              { label: 'Jane Smith', value: 'jane' },
              { label: 'Alice Cooper', value: 'alice' },
            ]}
            value={formik.values.shareWith}
            onChange={(val) => formik.setFieldValue('shareWith', val)}
            onBlur={() => formik.setFieldTouched('shareWith', true)}
            error={
              formik.touched.shareWith ? (formik.errors.shareWith as string | undefined) : undefined
            }
            className='mt-1 w-full'
          />
        </div>

        {/* Meeting Points (rich text) */}
        <div>
          <FormLabel>Meeting Points</FormLabel>
          <div className='mt-1 min-h-[200px]'>
            {/* Mantine TipTap rich editor — we only use the toolbar + content */}
            <RichTextEditor editor={editor}>
              <RichTextEditor.Toolbar sticky stickyOffset={60}>
                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.Bold />
                  <RichTextEditor.Italic />
                  <RichTextEditor.Underline />
                  <RichTextEditor.Strikethrough />
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.H1 />
                  <RichTextEditor.H2 />
                  <RichTextEditor.H3 />
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.BulletList />
                  <RichTextEditor.OrderedList />
                  <RichTextEditor.Blockquote />
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.Link />
                  <RichTextEditor.Unlink />
                </RichTextEditor.ControlsGroup>
              </RichTextEditor.Toolbar>

              <RichTextEditor.Content className='min-h-32' />
            </RichTextEditor>
          </div>

          {/* pass error prop to a small invisible wrapper? user requested errors passed as prop — 
              here we don't render a separate error message, but set touched for meetingPoints on blur/save */}
          {/* If your project has a custom wrapper for rich editor that accepts `error` prop, replace above with it. */}
        </div>

        {/* Attachment area */}
        <div>
          <div className='mt-2 flex items-center gap-4'>
            <label
              htmlFor='attachments'
              className='inline-flex items-center justify-center size-[4.5rem] rounded border border-border-light bg-slate-200 cursor-pointer'
            >
              <IconPlus className='size-8' />
            </label>
            <input
              id='attachments'
              type='file'
              multiple
              onChange={handleFilesChange}
              className='hidden'
            />
            <div className='flex flex-col gap-1'>
              {files.length === 0 ? (
                <span className='text-sm text-text-subHeading'>No files added</span>
              ) : (
                files.map((f, i) => (
                  <div key={i} className='flex items-center gap-2 text-sm'>
                    <span className='truncate max-w-xs'>{f.name}</span>
                    <button
                      type='button'
                      onClick={() => removeFile(i)}
                      className='text-red-500 text-xs'
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <FormLabel>Attachment</FormLabel>
        </div>

        {/* Submit */}
        <div className='flex justify-end'>
          <Button type='submit' radius='full' className='!text-sm !font-medium'>
            Save MOM
          </Button>
        </div>
      </form>
    </Container>
  );
}
