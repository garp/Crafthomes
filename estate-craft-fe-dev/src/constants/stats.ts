export const CHART_COLORS = {
  OPEN: {
    PRIMARY: '#549DD0',
    BACKGROUND: '#DFEFFA',
  },
  OVERDUE: {
    PRIMARY: '#FC3400',
    BACKGROUND: '#FAEBDF',
  },
  IN_PROGRESS: {
    PRIMARY: '#7B56FC',
    BACKGROUND: '#E5DFFA',
  },
  COMPLETED: {
    PRIMARY: '#11C4A6',
    BACKGROUND: '#E0FADF',
  },
} as const;

export const DEFAULT_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: false,
    },
  },
  scales: {
    x: {
      display: false,
    },
    y: {
      display: false,
    },
  },
  elements: {
    point: {
      radius: 0,
    },
  },
  interaction: {
    intersect: false,
  },
} as const;

export const CHART_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] as const;
