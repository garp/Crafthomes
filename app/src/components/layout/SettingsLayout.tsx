import { Outlet } from 'react-router-dom';
import { TabNavigation } from '../../pages/settings/components/TabNavigation';

export default function SettingsLayout() {
  return (
    <>
      <TabNavigation />
      <Outlet />
    </>
  );
}
