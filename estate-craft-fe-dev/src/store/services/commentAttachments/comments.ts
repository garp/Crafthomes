import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TAttachment } from '../../types/common.types';

export type TLocalAttachment = TAttachment;

export type TAttachmentSource = 'description' | 'comment';

export type TCommentAttachmentsState = {
  byCommentId: Record<string, TAttachment[]>;
  attachments: TLocalAttachment[];
};

const initialState: TCommentAttachmentsState = {
  byCommentId: {},
  attachments: [],
};

type TSetAttachmentsPayload = {
  commentId: string;
  attachments: TAttachment[];
};

type TAddAttachmentsPayload = {
  commentId: string;
  attachments: TAttachment[];
};

type TClearCommentPayload = {
  commentId: string;
};

const commentAttachmentsSlice = createSlice({
  name: 'commentAttachments',
  initialState,
  reducers: {
    setAttachments(state, action: PayloadAction<TSetAttachmentsPayload>) {
      const { commentId, attachments } = action.payload;
      state.byCommentId[commentId] = attachments;
    },
    addAttachments(state, action: PayloadAction<TAddAttachmentsPayload>) {
      const { commentId, attachments } = action.payload;
      const existing = state.byCommentId[commentId] || [];
      state.byCommentId[commentId] = [...existing, ...attachments];
    },
    removeAttachment(state, action: PayloadAction<{ key: string }>) {
      const { key } = action.payload;

      state.attachments = state.attachments.filter((att) => att.key !== key);
    },
    clearComment(state, action: PayloadAction<TClearCommentPayload>) {
      const { commentId } = action.payload;
      delete state.byCommentId[commentId];
    },
    clearAll(state) {
      state.byCommentId = {};
    },
    pushAttachments: (state, action: PayloadAction<TLocalAttachment[]>) => {
      state.attachments.push(...action.payload);
    },
  },
});

export const {
  setAttachments: setCommentAttachments,
  addAttachments: addCommentAttachments,
  removeAttachment,
  clearComment: clearCommentAttachments,
  clearAll: clearAllCommentAttachments,
  pushAttachments,
} = commentAttachmentsSlice.actions;

export const commentAttachmentsReducer = commentAttachmentsSlice.reducer;

// Selectors
export const selectCommentAttachments = (
  state: { commentAttachments: TCommentAttachmentsState },
  commentId: string,
) => state.commentAttachments.byCommentId[commentId] || [];
