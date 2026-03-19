import { useSearchParams } from 'react-router-dom';
import Policy from '../../../components/settings/Policy';

export default function ProjectSettings() {
  const [searchParams] = useSearchParams();
  const subtab = searchParams.get('subtab');
  function renderSubTab() {
    switch (subtab) {
      case 'policy':
        return (
          <>
            <Policy />
          </>
        );
      default:
        return <></>;
    }
  }
  return <>{renderSubTab()}</>;
}
