export interface TeamAvatarProps {
  members: { initial: string; color: string }[];
}
export interface TeamMember {
  id: string;
  name: string;
  initial: string;
  color: string;
}

export interface ProjectData {
  id: string;
  projectName: string;
  client: string;
  location: string;
  payment: 'pending' | 'paid';
  dueDate: string;
  lastUpdated: string;
  phase: string;
  progress: number;
  progressText?: string;
  status: 'in-progress' | 'completed' | 'on-hold' | 'cancelled';
  teamMembers: TeamMember[];
}
