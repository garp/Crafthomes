import type { TCreateScreenData } from '../../../../types/common.types';

export const BREADCRUMB_DATA = [
  {
    title: 'Home',
    link: '/',
  },
  {
    title: 'Project Name',
    link: '/projects',
  },
  {
    title: 'MOM',
    link: '',
  },
];

export const createPageData: TCreateScreenData = {
  title: 'Get Started with MOM',
  buttonText: 'Create MOM',
  subtitle: "It looks like you don't have any MOM yet. Let's create your first MOM to get started!",
  heading: 'MOM',
};
