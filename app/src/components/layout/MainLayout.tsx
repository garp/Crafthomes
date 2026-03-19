import { Outlet, useLocation } from 'react-router-dom';
import { useMatch } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

import { Header } from '../Header';
import { Sidebar } from '../Sidebar';
import { menuItems } from '../../constants/layout';
import { projectMenuItems } from '../../constants/project';
import { ProjectSidebar } from '../project/ProjectSidebar';
import { getMainSidebarItems, getProjectSidebarItems } from '../../utils/sidebar';
import {
  useModuleAccess,
  SIDEBAR_ID_TO_TOP_LEVEL,
  PROJECT_ID_TO_TYPE_LEVEL,
} from '../../hooks/useModuleAccess';

export const MainLayout = () => {
  const location = useLocation();
  const isProjectRoute = useMatch('/projects/:id/*');
  const { hasTopLevel, hasTypeLevel, isSuperAdmin } = useModuleAccess();

  // Get sidebar items from localStorage or fallback to defaults, then filter by module access
  const mainSidebarItems = useMemo(() => {
    const items = getMainSidebarItems();
    const base = items.length > 0 ? items : menuItems;
    if (isSuperAdmin) return base;
    return base.filter((item) => {
      const topLevelKey = SIDEBAR_ID_TO_TOP_LEVEL[item.id];
      return topLevelKey ? hasTopLevel(topLevelKey) : true;
    });
  }, [isSuperAdmin, hasTopLevel]);

  const projectSidebarItems = useMemo(() => {
    const hiddenItems = ['version', 'deliverable', 'reports'];
    const items = getProjectSidebarItems().filter((item) => !hiddenItems.includes(item.id));
    const base = items.length > 0 ? items : projectMenuItems;
    if (isSuperAdmin) return base;
    return base.filter((item) => {
      // Always show "All Projects" link
      if (item.id === 'all-projects') return true;
      const typeLevelKey = PROJECT_ID_TO_TYPE_LEVEL[item.id];
      return typeLevelKey ? hasTypeLevel('projects', typeLevelKey) : true;
    });
  }, [isSuperAdmin, hasTypeLevel]);

  return (
    <div className='flex flex-col h-screen bg-white'>
      <Header />
      <div className='flex min-h-[calc(100vh-5rem)]'>
        {isProjectRoute ? (
          <ProjectSidebar menuItems={projectSidebarItems} />
        ) : (
          <Sidebar menuItems={mainSidebarItems} />
        )}
        <div className='w-full min-h-[calc(100vh-5rem)]  flex flex-col  border-amber-500 bg-[#F3F4F7] p-3 md:p-6 overflow-y-auto ml-[68px]'>
          <AnimatePresence mode='wait'>
            <div key={location.pathname} className='flex flex-col flex-1  border-black '>
              <Outlet />
            </div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
