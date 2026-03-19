import currencyCodes from 'currency-codes';
import { State, City } from 'country-state-city';
import { PaymentIcon, ProjectsIcon } from '../components';
import QuotationIcon from '../components/icons/QuotationIcon';
import FilesIcon from '../components/icons/FilesIcon';
import TimelineIcon from '../components/icons/TimelineIcon';
import SnagIcon from '../components/icons/SnagIcon';
// import VersionIcon from '../components/icons/VersionIcon';
import MOMIcon from '../components/icons/MOMIcon';
// import DeliverableIcon from '../components/icons/DeliverableIcon';
// import { ReportsIcon } from '../components/icons/ReportsIcon';
import { SiteVisitIcon } from '../components/icons/SiteVisitIcon';
import TaskIcon from '../components/icons/TaskIcon';
import { ProjectSummaryIcon } from '../components/icons/ProjectSumaryIcon';

export const PROJECT_STATS_DATA = [
  {
    title: 'TOTAL CLIENT',
    value: '151',
    iconType: 'client',
  },
  {
    title: 'TOTAL PROJECTS',
    value: '51',
    iconType: 'project',
  },
  {
    title: 'PENDING PAYMENT',
    value: '49',
    iconType: 'payment',
  },
  {
    title: 'AVERAGE PROGRESS',
    value: '32%',
    iconType: 'progress',
  },
];

export const currencyOptions = currencyCodes.codes().map((code) => {
  const currency = currencyCodes.code(code);
  return {
    label: `${currency?.currency} (${currency?.code})`,
    value: currency?.code || '', // keep currency code as value
  };
});

export function getIndianStates() {
  return State.getStatesOfCountry('IN').map((s) => ({
    label: s.name,
    value: s.name, // 👈 use state name instead of isoCode
    isoCode: s.isoCode, // keep isoCode in case you need it for city lookup
  }));
}

// Cities based on selected state name
export const getCities = (stateName: string) => {
  const state = State.getStatesOfCountry('IN').find((s) => s.name === stateName);
  if (!state) return [];
  return City.getCitiesOfState('IN', state.isoCode).map((c) => ({
    label: c.name,
    value: c.name, // 👈 city name as value
  }));
};

export const BUSINESS_TYPES_OPTIONS = [
  { label: 'Retail', value: 'RETAIL' },
  { label: 'Commercial', value: 'COMMERCIAL' },
  { label: 'Industrial', value: 'INDUSTRIAL' },
  { label: 'Service', value: 'SERVICE' },
  { label: 'Other', value: 'OTHER' },
];
export const PROJECT_SCOPE_OPTIONS = [
  { label: 'Full scale', value: 'FULL_SCALE' },
  { label: 'Partial', value: 'PARTIAL' },
  { label: 'Consultation', value: 'CONSULTATION' },
  { label: 'Maintenance', value: 'MAINTENANCE' },
  { label: 'Other', value: 'OTHER' },
];

export const projectMenuItems = [
  {
    id: 'all-projects',
    label: 'All Projects',
    path: '/projects',
    icon: ProjectsIcon,
  },
  {
    id: 'summary',
    label: 'Summary',
    path: '/summary',
    icon: ProjectSummaryIcon,
  },
  {
    id: 'quotation',
    label: 'Quotation',
    path: '/quotation',
    icon: QuotationIcon,
  },
  {
    id: 'files',
    label: 'Files',
    path: '/files',
    icon: FilesIcon,
  },
  {
    id: 'task',
    label: 'Task',
    path: '/task',
    icon: TaskIcon,
  },
  {
    id: 'timeline',
    label: 'Timeline',
    path: '/timeline',
    icon: TimelineIcon,
  },
  {
    id: 'snag',
    label: 'Snag',
    path: '/snag',
    icon: SnagIcon,
  },
  // {
  //   id: 'version',
  //   label: 'Version',
  //   path: '/version',
  //   icon: VersionIcon,
  // },
  {
    id: 'mom',
    label: 'MOM',
    path: '/mom',
    icon: MOMIcon,
  },
  // {
  //   id: 'deliverable',
  //   label: 'Deliverable',
  //   path: '/deliverable',
  //   icon: DeliverableIcon,
  // },
  {
    id: 'payment',
    label: 'Payment',
    path: '/payment',
    icon: PaymentIcon,
  },
  // {
  //   id: 'reports',
  //   label: 'Reports',
  //   path: '/reports',
  //   icon: ReportsIcon,
  // },
  {
    id: 'site-visit',
    label: 'Site Visit',
    path: '/site-visit',
    icon: SiteVisitIcon,
  },
];

export const CURRENCIES = [
  {
    label: 'USD',
    value: 'USD',
  },
  {
    label: 'INR',
    value: 'INR',
  },
];
