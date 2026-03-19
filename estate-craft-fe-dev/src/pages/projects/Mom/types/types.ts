import type { TMOM } from '../../../../store/types/mom.types';

export type TCreateMOMSidebarProps = {
  closeSidebar: () => void;
  isOpenSidebar: boolean;
  initialValues?: TMOM | null;
  mode?: 'create' | 'edit';
  projectId: string;
};

export type TMOMListPageProps = {
  openSidebar: (mom?: TMOM) => void;
  projectId: string;
};
