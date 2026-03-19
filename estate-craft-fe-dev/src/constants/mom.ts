import googleMeetLogo from '../assets/img/googleMeetLogo.png';
import zoomLogo from '../assets/img/zoomLogo.png';
import slackLogo from '../assets/img/slackLogo.png';
import teamsLogo from '../assets/img/teamsLogo.png';
import inPersonLogo from '../assets/img/inPersonLogo.webp';

export const HeldOn = {
  GMEET: 'GMEET',
  ZOOM: 'ZOOM',
  SLACK: 'SLACK',
  TEAMS: 'TEAMS',
  IN_PERSON: 'IN_PERSON',
  OTHER: 'OTHER',
} as const;

export type HeldOn = (typeof HeldOn)[keyof typeof HeldOn];

export const HELD_ON_OPTIONS = [
  { label: 'Google Meet', value: HeldOn.GMEET, icon: googleMeetLogo },
  { label: 'Zoom', value: HeldOn.ZOOM, icon: zoomLogo },
  { label: 'Slack', value: HeldOn.SLACK, icon: slackLogo },
  { label: 'Teams', value: HeldOn.TEAMS, icon: teamsLogo },
  { label: 'In Person', value: HeldOn.IN_PERSON, icon: inPersonLogo },
  { label: 'Other', value: HeldOn.OTHER },
];

export interface MOMData {
  id: string;
  date: string;
  time: string;
  project: string;
  meetingWith: string;
  attachments: number;
  status: string;
}

export const SAMPLE_MOM_DATA: MOMData[] = [
  {
    id: '1',
    date: '11/07/2025',
    time: '10:30AM',
    project: 'Project Name',
    meetingWith: 'Anita Singh',
    attachments: 4,
    status: 'PENDING',
  },
  {
    id: '2',
    date: '11/07/2025',
    time: '02:15PM',
    project: 'Project Name',
    meetingWith: 'Anita Singh',
    attachments: 2,
    status: 'COMPLETED',
  },
  {
    id: '3',
    date: '11/07/2025',
    time: '04:45PM',
    project: 'Project Name',
    meetingWith: 'Anita Singh',
    attachments: 6,
    status: 'PENDING',
  },
  {
    id: '4',
    date: '12/07/2025',
    time: '09:00AM',
    project: 'Project Name',
    meetingWith: 'Anita Singh',
    attachments: 1,
    status: 'CANCELLED',
  },
  {
    id: '5',
    date: '12/07/2025',
    time: '11:30AM',
    project: 'Project Name',
    meetingWith: 'Anita Singh',
    attachments: 3,
    status: 'COMPLETED',
  },
];
