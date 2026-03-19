// import Container from '../../../components/common/Container';
// import { useNavigate, useParams } from 'react-router-dom';
// import CreateScreeen from '../../../components/common/CreateScreen';
import SiteVisitTable from './components/SiteVisitTable';

export default function SiteVisitPage() {
  // const navigate = useNavigate();
  // const { id } = useParams();
  return (
    <>
      {/* {0 ? (
        <CreateScreeen
          onClick={() => navigate(`/projects/${id}/site-visit/create`)}
          createPageData={{
            buttonText: 'Create Site visit',
            heading: 'SITE VISIT',
            subtitle:
              'It looks like you don’t have any site visit yet. Let’s create your first site visit to get started!',
            title: 'Get Started with Site Visit',
          }}
        />
      ) : (
        <SiteVisitTable />
      )} */}
      <SiteVisitTable />
    </>
  );
}
