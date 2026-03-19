export type TSummaryTaskCard = {
  total: number;
  addedLast6Months: number;
};

export type TSummaryTaskResponse = {
  openTask: TSummaryTaskCard;
  overdueTask: TSummaryTaskCard;
  inProgress: TSummaryTaskCard;
  completed: TSummaryTaskCard;

  legacy: Array<
    | { pendingTasks: number; recentlyAddedPendingTasks: number }
    | { inProgressTasks: number; recentlyAddedInProgressTasks: number }
    | { completedTasks: number; recentlyAddedCompletedTasks: number }
    | { overdueTasks: number; recentlyAddedOverdueTasks: number }
  >;
};

export type TSummaryPaymentParty = {
  id: string;
  name: string;
};

export type TSummaryPaymentItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

export type TSummaryPaymentStatus =
  | 'DRAFT'
  | 'PAID'
  | 'PENDING'
  | 'PARTIALLY_PAID'
  | 'OVERDUE'
  | 'LATE_PAID'
  | (string & {});

export type TSummaryPaymentType = 'NA' | 'ADVANCE' | (string & {});

export type TSummaryPaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'CHEQUE'
  | 'ONLINE_TRANSFER'
  | 'OTHER'
  | 'NA'
  | (string & {});

export type TSummaryPaymentCard = {
  id: string;
  sNo: number;
  project: TSummaryPaymentParty;
  client: TSummaryPaymentParty;
  dueDate: string; // ISO string
  paymentStatus: TSummaryPaymentStatus;
  paymentDate: string | null; // ISO string (nullable)
  paymentType: TSummaryPaymentType;
  paymentMethod: TSummaryPaymentMethod;
  otherPaymentMethod: string | null;
  paymentItems: TSummaryPaymentItem[];
};

export type TSummaryPaymentProgressResponse = {
  paymentSummary: TSummaryPaymentCard[];
};

export type TSummaryMomProgressStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | (string & {});

export type TSummaryMomAttachment = {
  id: string;
  name: string;
  url: string;
  key: string;
  type: string;
  mimeType: string;
  size: number;
};

export type TSummaryMomAttendee = {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export type TSummaryMomCard = {
  id: string;
  sNo: number;
  startDate: string; // ISO string
  project: TSummaryPaymentParty;
  momStatus: TSummaryMomProgressStatus;
  momAttendees: TSummaryMomAttendee[];
  attachments: TSummaryMomAttachment[];

  // Optional AI fields (if backend adds them later)
  aiInsights?: string;
  suggestedAction?: string;
};

export type TSummaryMomSummaryResponse = {
  momSummary: TSummaryMomCard[];
};

// Tasks by Type API types
export type TSummaryTaskByTypeAssignee = {
  id: string;
  name: string;
};

export type TSummaryTaskByTypeItem = {
  id: string;
  sNo: number;
  name: string;
  priority: string | null;
  phase: {
    id: string;
    name: string;
  };
  project: {
    id: string;
    name: string;
  };
  assignees: TSummaryTaskByTypeAssignee[];
};

export type TSummaryTasksByTypePagination = {
  total: number;
  page: number;
  limit: number;
};

export type TSummaryTasksByTypeResponse = {
  openTasks: TSummaryTaskByTypeItem[];
  runningTasks: TSummaryTaskByTypeItem[];
  pagination: {
    openTasks: TSummaryTasksByTypePagination;
    runningTasks: TSummaryTasksByTypePagination;
  };
};

export type TSummaryTasksByTypeArgs = {
  pageNo?: number;
  pageLimit?: number;
};
