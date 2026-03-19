import type { TBreadcrumbData, TCreateScreenData } from '../../../../types/common.types';
// import { getParam } from '../../../../utils/helper';

export const createVersionScreenData: TCreateScreenData = {
  buttonText: 'Create Version',
  heading: 'Version',
  // link: `/projects/${getParam('id')}/version`,
  subtitle:
    "It looks like you don’t have any version yet. Let's create your first timeline to get started!",
  title: 'Get Started with Version',
};

export const BREADCRUMB_DATA: TBreadcrumbData[] = [
  {
    link: '/',
    title: 'Home',
  },
  {
    link: '/projects',
    title: 'Project Name',
  },
  {
    link: '',
    title: 'Version',
  },
];
