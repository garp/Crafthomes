import { useSearchParams } from 'react-router-dom';
import MasterPhases from '../../../components/settings/MasterPhases';
import MasterTasks from '../../../components/settings/MasterTasks';
import ProjectTypeGroupPage from '../ProjectTypeGroup/ProjectTypeGroupPage';
import TimelineTemplatePage from '../TimelineTemplate/TimelineTemplatePage';

export default function PhaseManagement() {
  const [searchParams] = useSearchParams();
  const subtab = searchParams.get('subtab');
  function renderSubTab() {
    switch (subtab) {
      case 'projectTypeGroup':
        return (
          <>
            <ProjectTypeGroupPage />
          </>
        );
      case 'timelines':
        return (
          <>
            <TimelineTemplatePage />
          </>
        );
      case 'phases':
        return (
          <>
            <MasterPhases />
          </>
        );
      case 'tasks':
        return (
          <>
            <MasterTasks />
          </>
        );
      default:
        return <></>;
    }
  }
  return <>{renderSubTab()}</>;
}
