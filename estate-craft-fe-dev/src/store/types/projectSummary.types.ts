export type TProjectSummaryPhase = {
  [x: string]: any;
  id: string;
  name: string;
  totalTasks: number;
  completionPercentage: number;
};

export type TProjectSummary = {
  id: string;
  sNo: number;
  name: string;
  paymentStatus: string;
  quotation: string;
  totalTasks: number;
  client: {
    id: string;
    name: string;
  };
  projectManager: {
    id: string;
    name: string;
  };
  startDate: string;
  endDate: string;
  projectType: string;
  timelineDetails: {
    totalTimelines: number;
    totalPhases: number;
    phases: TProjectSummaryPhase[];
  };
};
